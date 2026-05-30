const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const DATA_PATH = path.join(__dirname, '../data/antimention.json');
const FOOTER = '\n\n> bigmanj tech';

// ---------- Storage functions ----------
function loadData() {
    try {
        if (!fs.existsSync(DATA_PATH)) return { groups: {} };
        return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    } catch {
        return { groups: {} };
    }
}

function saveData(data) {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// ---------- Helper functions ----------
function getOwnerJid() {
    const ownerNumber = settings.ownerNumber;
    if (!ownerNumber) return null;
    let clean = ownerNumber.toString().replace(/\s/g, '');
    if (!clean.includes('@')) clean = `${clean}@s.whatsapp.net`;
    return clean;
}

async function isGroupAdmin(sock, chatId, jid) {
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participant = metadata.participants.find(p => p.id === jid);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (err) {
        console.error('Error checking admin status:', err);
        return false;
    }
}

async function isBotAdmin(sock, chatId) {
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    return await isGroupAdmin(sock, chatId, botJid);
}

// ---------- Action execution ----------
async function executeAction(sock, chatId, senderId, message, action) {
    // 1. Delete the message
    try {
        await sock.sendMessage(chatId, { delete: message.key });
    } catch (err) {
        console.error('Failed to delete message:', err);
    }

    // 2. Warn if needed
    let warningSent = false;
    if (action === 'warn' || action === 'kick') {
        const warning = `⚠️ *Anti‑mention*\nUmewataja watu kwenye ujumbe wako. Hatua: ${action.toUpperCase()}.` + FOOTER;
        await sock.sendMessage(chatId, { text: warning });
        warningSent = true;
    }

    // 3. Kick if action is 'kick' and bot is admin
    if (action === 'kick') {
        const botIsAdmin = await isBotAdmin(sock, chatId);
        if (!botIsAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Bot sio admin – haiwezi kufukuza. Badilisha mode kuwa warn au delete.' });
            return;
        }
        try {
            await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
            await sock.sendMessage(chatId, { text: `🔨 Mtumiaji aliyetaja watu amefukuzwa.` + FOOTER });
        } catch (err) {
            console.error('Kick failed:', err);
            if (!warningSent) {
                await sock.sendMessage(chatId, { text: '❌ Kushindwa kumfukuza mtumiaji. Hakikisha bot ni admin na namba sahihi.' });
            }
        }
    }
}

// ---------- Main handler (called from main.js) ----------
async function handleMentionCheck(sock, chatId, message) {
    // Skip bot's own messages
    if (message.key.fromMe) return;

    // Check if it's a group
    if (!chatId.endsWith('@g.us')) return;

    // Load group settings
    const data = loadData();
    if (!data.groups[chatId] || !data.groups[chatId].enabled) return;

    const senderId = message.key.participant || message.key.remoteJid;
    const ownerJid = getOwnerJid();

    // Exception 1: sender is bot owner
    if (ownerJid && senderId === ownerJid) return;

    // Exception 2: sender is group admin
    const isSenderAdmin = await isGroupAdmin(sock, chatId, senderId);
    if (isSenderAdmin) return;

    // Check for any mention in the message
    const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentionedJids.length === 0) return;

    // If we reach here, it's a normal member mentioning someone
    const action = data.groups[chatId].action || 'warn'; // default warn
    await executeAction(sock, chatId, senderId, message, action);
}

// ---------- Command handler (.antimention) ----------
async function antimentionCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye group pekee.' + FOOTER, quoted: message });
        return;
    }

    // Only owner or sudo can change settings
    const isOwnerOrSudo = require('../lib/isOwner');
    const isAuthorized = await isOwnerOrSudo(senderId, sock, chatId);
    if (!isAuthorized && !message.key.fromMe) {
        await sock.sendMessage(chatId, { text: '❌ Owner au sudo pekee ndiye anaweza kutumia .antimention.' + FOOTER, quoted: message });
        return;
    }

    const data = loadData();
    if (!data.groups[chatId]) data.groups[chatId] = { enabled: false, action: 'warn' };

    const sub = (args[0] || '').toLowerCase();

    // .antimention on
    if (sub === 'on') {
        data.groups[chatId].enabled = true;
        saveData(data);
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑mention IMEWASHWA* – Mode: ${data.groups[chatId].action}. Ujumbe wa member wa kawaida ulio na mention utafutwa.` + FOOTER, quoted: message });
    }
    // .antimention off
    else if (sub === 'off') {
        data.groups[chatId].enabled = false;
        saveData(data);
        await sock.sendMessage(chatId, { text: `🔓 *Anti‑mention IMEZIMWA*` + FOOTER, quoted: message });
    }
    // .antimention set <mode>  (kick, warn, delete)
    else if (sub === 'set') {
        const mode = (args[1] || '').toLowerCase();
        if (!['kick', 'warn', 'delete'].includes(mode)) {
            await sock.sendMessage(chatId, { text: `❌ Mode isiyo sahihi. Tumia: kick, warn, delete` + FOOTER, quoted: message });
            return;
        }
        data.groups[chatId].action = mode;
        saveData(data);
        await sock.sendMessage(chatId, { text: `✅ Mode imebadilishwa kuwa: *${mode}*` + FOOTER, quoted: message });
    }
    // Show status
    else {
        const status = data.groups[chatId].enabled ? 'IMEWASHWA' : 'IMEZIMWA';
        const mode = data.groups[chatId].action;
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑mention*\nHali: ${status}\nMode: ${mode}\n\nMatumizi:\n.antimention on/off\n.antimention set <kick|warn|delete>` + FOOTER, quoted: message });
    }
}

// For compatibility (status handler not used here)
function isTextViolating(text) {
    return false;
}

module.exports = { antimentionCommand, handleMentionCheck, isTextViolating };