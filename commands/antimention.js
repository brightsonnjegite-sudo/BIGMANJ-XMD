const fs = require('fs');
const path = require('path');
const settings = require('../settings'); // Import your settings.js

const DATA_PATH = path.join(__dirname, '../data/antimention.json');

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

// Get protected numbers from settings.js
function getProtectedNumbers() {
    const numbers = [];
    if (settings.ownerNumber) numbers.push(settings.ownerNumber);
    if (settings.sudoNumbers && Array.isArray(settings.sudoNumbers)) {
        numbers.push(...settings.sudoNumbers);
    }
    // Clean numbers: remove any spaces, ensure they have @s.whatsapp.net
    return numbers.map(num => {
        let clean = num.toString().replace(/\s/g, '');
        if (!clean.includes('@')) clean = `${clean}@s.whatsapp.net`;
        return clean;
    });
}

// Command .antimention on/off (owner/sudo only)
async function antimentionCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye group pekee.' }, { quoted: message });
        return;
    }

    // Check if sender is owner/sudo (using your lib/isOwner if needed, or read from settings)
    const isOwnerOrSudo = require('../lib/isOwner');
    const isAuthorized = await isOwnerOrSudo(senderId, sock, chatId);
    if (!isAuthorized && !message.key.fromMe) {
        await sock.sendMessage(chatId, { text: '❌ Owner au sudo pekee ndiye anaweza kutumia .antimention.' }, { quoted: message });
        return;
    }

    const data = loadData();
    if (!data.groups[chatId]) data.groups[chatId] = { enabled: false };

    const sub = (args[0] || '').toLowerCase();

    if (sub === 'on') {
        data.groups[chatId].enabled = true;
        saveData(data);
        await sock.sendMessage(chatId, { text: '🛡️ *Anti‑mention IMEWASHWA* – ujumbe wowote unaomention owner/sudo utafutwa.' }, { quoted: message });
    } else if (sub === 'off') {
        data.groups[chatId].enabled = false;
        saveData(data);
        await sock.sendMessage(chatId, { text: '🔓 *Anti‑mention IMEZIMWA*' }, { quoted: message });
    } else {
        const status = data.groups[chatId].enabled ? 'IMEWASHWA' : 'IMEZIMWA';
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑mention*\nHali: ${status}\n\nMatumizi: .antimention on/off` }, { quoted: message });
    }
}

// Function to check and delete mentions (call this from message handler)
async function handleMentionCheck(sock, chatId, message) {
    const data = loadData();
    if (!data.groups[chatId] || !data.groups[chatId].enabled) return;

    const protectedJids = getProtectedNumbers();
    if (protectedJids.length === 0) return;

    // Get all mentioned JIDs from the message
    const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentionedJids.length === 0) return;

    // Check if any mentioned JID is in the protected list
    const isViolation = mentionedJids.some(jid => protectedJids.includes(jid));
    if (!isViolation) return;

    // Delete the offending message
    try {
        await sock.sendMessage(chatId, { delete: message.key });
    } catch (err) {
        console.error('Failed to delete mention message:', err);
    }

    // Optional: send a warning (can be removed if you don't want extra messages)
    await sock.sendMessage(chatId, { text: `⚠️ *Anti‑mention*\nHuruhusiwi kumtag owner au sudo wa bot!` });
}

module.exports = { antimentionCommand, handleMentionCheck };