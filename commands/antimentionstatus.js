const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const DATA_PATH = path.join(__dirname, '../data/antimentionstatus.json');
const FOOTER = '\n\n> bigmanj tech';

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

async function executeAction(sock, chatId, senderId, message, action) {
    // Delete the message
    try {
        await sock.sendMessage(chatId, { delete: message.key });
    } catch (err) {
        console.error('Failed to delete status mention message:', err);
    }

    if (action === 'deleteonly') return; // no warning, no kick

    if (action === 'deletewarn') {
        const warning = `⚠️ *Anti‑StatusMention*\nUmewashiriki status kwenye group. Hatua: WARNING.` + FOOTER;
        await sock.sendMessage(chatId, { text: warning });
    }
    else if (action === 'deletewarnkick') {
        const warning = `⚠️ *Anti‑StatusMention*\nUmewashiriki status kwenye group. Hatua: KICK.` + FOOTER;
        await sock.sendMessage(chatId, { text: warning });
        const botIsAdmin = await isBotAdmin(sock, chatId);
        if (!botIsAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Bot sio admin – haiwezi kufukuza. Badilisha mode kuwa deletewarn au deleteonly.' });
            return;
        }
        try {
            await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
            await sock.sendMessage(chatId, { text: `🔨 Mtumiaji aliyeshiriki status amefukuzwa.` + FOOTER });
        } catch (err) {
            console.error('Kick failed:', err);
        }
    }
}

// Called from main.js for each group message
async function handleStatusMentionCheck(sock, chatId, message) {
    if (message.key.fromMe) return;
    if (!chatId.endsWith('@g.us')) return;

    const data = loadData();
    if (!data.groups[chatId] || !data.groups[chatId].enabled) return;

    const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const isStatusMention = mentionedJids.includes('status@broadcast');
    if (!isStatusMention) return;

    const senderId = message.key.participant || message.key.remoteJid;
    const ownerJid = getOwnerJid();

    // Admin: allow (no action)
    const isSenderAdmin = await isGroupAdmin(sock, chatId, senderId);
    if (isSenderAdmin) {
        console.log(`Admin ${senderId} shared a status – allowed.`);
        return;
    }

    // Bot owner: delete only (no warning, no kick)
    if (ownerJid && senderId === ownerJid) {
        console.log(`Owner ${senderId} shared a status – deleting only.`);
        try {
            await sock.sendMessage(chatId, { delete: message.key });
        } catch (err) {
            console.error('Failed to delete owner status mention:', err);
        }
        return;
    }

    // Normal member: apply configured action
    const action = data.groups[chatId].action || 'deletewarn';
    await executeAction(sock, chatId, senderId, message, action);
}

// Command handler for .antimentionstatus
async function antimentionstatusCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye group pekee.' + FOOTER, quoted: message });
        return;
    }

    const isOwnerOrSudo = require('../lib/isOwner');
    const isAuthorized = await isOwnerOrSudo(senderId, sock, chatId);
    if (!isAuthorized && !message.key.fromMe) {
        await sock.sendMessage(chatId, { text: '❌ Owner au sudo pekee ndiye anaweza kutumia .antimentionstatus.' + FOOTER, quoted: message });
        return;
    }

    const data = loadData();
    if (!data.groups[chatId]) data.groups[chatId] = { enabled: false, action: 'deletewarn' };

    const sub = (args[0] || '').toLowerCase();

    if (sub === 'on') {
        data.groups[chatId].enabled = true;
        saveData(data);
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑StatusMention IMEWASHWA* – Mode: ${data.groups[chatId].action}.` + FOOTER, quoted: message });
    }
    else if (sub === 'off') {
        data.groups[chatId].enabled = false;
        saveData(data);
        await sock.sendMessage(chatId, { text: `🔓 *Anti‑StatusMention IMEZIMWA*` + FOOTER, quoted: message });
    }
    else if (sub === 'set') {
        const mode = (args[1] || '').toLowerCase();
        let action;
        if (mode === 'deletewarnkick') action = 'deletewarnkick';
        else if (mode === 'deletewarn') action = 'deletewarn';
        else if (mode === 'deleteonly') action = 'deleteonly';
        else {
            await sock.sendMessage(chatId, { text: `❌ Mode isiyo sahihi. Tumia: deletewarnkick, deletewarn, deleteonly` + FOOTER, quoted: message });
            return;
        }
        data.groups[chatId].action = action;
        saveData(data);
        await sock.sendMessage(chatId, { text: `✅ Mode imebadilishwa kuwa: *${action}*` + FOOTER, quoted: message });
    }
    else {
        const status = data.groups[chatId].enabled ? 'IMEWASHWA' : 'IMEZIMWA';
        const mode = data.groups[chatId].action;
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑StatusMention*\nHali: ${status}\nMode: ${mode}\n\nMatumizi:\n.antimentionstatus on/off\n.antimentionstatus set <deletewarnkick|deletewarn|deleteonly>` + FOOTER, quoted: message });
    }
}

module.exports = { antimentionstatusCommand, handleStatusMentionCheck };