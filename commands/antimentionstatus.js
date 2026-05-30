const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const DATA_PATH = path.join(__dirname, '../data/antimentionstatus.json');
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
        console.error('Failed to delete status mention message:', err);
    }

    // 2. Warn if needed
    let warningSent = false;
    if (action === 'delete warn' || action === 'delete warn kick') {
        const warning = `⚠️ *Anti‑StatusMention*\nUmewashiriki status kwenye group. Hatua: ${action.toUpperCase()}.` + FOOTER;
        await sock.sendMessage(chatId, { text: warning });
        warningSent = true;
    }

    // 3. Kick if action includes kick
    if (action === 'delete warn kick') {
        const botIsAdmin = await isBotAdmin(sock, chatId);
        if (!botIsAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Bot sio admin – haiwezi kufukuza. Badilisha mode kuwa delete warn au delete only.' });
            return;
        }
        try {
            await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
            await sock.sendMessage(chatId, { text: `🔨 Mtumiaji aliyeshiriki status amefukuzwa.` + FOOTER });
        } catch (err) {
            console.error('Kick failed:', err);
            if (!warningSent) {
                await sock.sendMessage(chatId, { text: '❌ Kushindwa kumfukuza mtumiaji. Hakikisha bot ni admin na namba sahihi.' });
            }
        }
    }
}

// ---------- Main handler (called from main.js for each group message) ----------
async function handleStatusMentionCheck(sock, chatId, message) {
    // Skip bot's own messages
    if (message.key.fromMe) return;

    // Only for groups
    if (!chatId.endsWith('@g.us')) return;

    // Load group settings
    const data = loadData();
    if (!data.groups[chatId] || !data.groups[chatId].enabled) return;

    // Detect status mention: look for mention of 'status@broadcast'
    const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const isStatusMention = mentionedJids.includes('status@broadcast');

    if (!isStatusMention) return;

    const senderId = message.key.participant || message.key.remoteJid;
    const ownerJid = getOwnerJid();

    // Rule 1: Sender is group admin → do nothing (allow)
    const isSenderAdmin = await isGroupAdmin(sock, chatId, senderId);
    if (isSenderAdmin) {
        console.log(`Admin ${senderId} shared a status – allowed.`);
        return;
    }

    // Rule 2: Sender is bot owner → delete message only (no warning, no kick)
    if (ownerJid && senderId === ownerJid) {
        console.log(`Bot owner ${senderId} shared a status – deleting message.`);
        try {
            await sock.sendMessage(chatId, { delete: message.key });
        } catch (err) {
            console.error('Failed to delete owner status mention:', err);
        }
        return;
    }

    // Rule 3: Normal member → apply action based on mode
    const action = data.groups[chatId].action || 'delete warn'; // default
    await executeAction(sock, chatId, senderId, message, action);
}

// ---------- Command handler (.antimentionstatus) ----------
async function antimentionstatusCommand(sock, chatId, message, args) {
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
        await sock.sendMessage(chatId, { text: '❌ Owner au sudo pekee ndiye anaweza kutumia .antimentionstatus.' + FOOTER, quoted: message });
        return;
    }

    const data = loadData();
    if (!data.groups[chatId]) data.groups[chatId] = { enabled: false, action: 'delete warn' };

    const sub = (args[0] || '').toLowerCase();

    // .antimentionstatus on
    if (sub === 'on') {
        data.groups[chatId].enabled = true;
        saveData(data);
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑StatusMention IMEWASHWA* – Mode: ${data.groups[chatId].action}. Ushirikiano wa status utafutwa kulingana na sheria.` + FOOTER, quoted: message });
    }
    // .antimentionstatus off
    else if (sub === 'off') {
        data.groups[chatId].enabled = false;
        saveData(data);
        await sock.sendMessage(chatId, { text: `🔓 *Anti‑StatusMention IMEZIMWA*` + FOOTER, quoted: message });
    }
    // .antimentionstatus set <mode>
    else if (sub === 'set') {
        const modeArg = (args[1] || '').toLowerCase();
        let action;
        if (modeArg === 'deletewarnkick' || modeArg === 'delete warn kick') {
            action = 'delete warn kick';
        } else if (modeArg === 'deletewarn' || modeArg === 'delete warn') {
            action = 'delete warn';
        } else if (modeArg === 'deleteonly' || modeArg === 'delete only') {
            action = 'delete only';
        } else {
            await sock.sendMessage(chatId, { text: `❌ Mode isiyo sahihi. Tumia: deletewarnkick, deletewarn, deleteonly` + FOOTER, quoted: message });
            return;
        }
        data.groups[chatId].action = action;
        saveData(data);
        await sock.sendMessage(chatId, { text: `✅ Mode imebadilishwa kuwa: *${action}*` + FOOTER, quoted: message });
    }
    // Show status
    else {
        const status = data.groups[chatId].enabled ? 'IMEWASHWA' : 'IMEZIMWA';
        const mode = data.groups[chatId].action;
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑StatusMention*\nHali: ${status}\nMode: ${mode}\n\nMatumizi:\n.antimentionstatus on/off\n.antimentionstatus set <deletewarnkick|deletewarn|deleteonly>` + FOOTER, quoted: message });
    }
}

module.exports = { antimentionstatusCommand, handleStatusMentionCheck };