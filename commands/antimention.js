const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const DATA_PATH = path.join(__dirname, '../data/antimention.json');
const FOOTER = '\n\n> bigmanj tech';  // ✅ small letters footer

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

function containsPhoneNumber(text) {
    const phoneRegex = /(?:\+?255|0)[\s\-]?[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4,}/;
    return phoneRegex.test(text);
}

function containsGroupMention(text) {
    const groupPhrases = /(this group was mentioned|group mentioned|@everyone|@all|group link)/i;
    return groupPhrases.test(text);
}

function isTextViolating(text) {
    if (!text) return false;
    return containsPhoneNumber(text) || containsGroupMention(text);
}

async function antimentionCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye group pekee.' + FOOTER, quoted: message });
        return;
    }

    const isOwnerOrSudo = require('../lib/isOwner');
    const isAuthorized = await isOwnerOrSudo(senderId, sock, chatId);
    if (!isAuthorized && !message.key.fromMe) {
        await sock.sendMessage(chatId, { text: '❌ Owner au sudo pekee ndiye anaweza kutumia .antimention.' + FOOTER, quoted: message });
        return;
    }

    const data = loadData();
    if (!data.groups[chatId]) data.groups[chatId] = { enabled: false };
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'on') {
        data.groups[chatId].enabled = true;
        saveData(data);
        await sock.sendMessage(chatId, { text: '🛡️ *Anti‑mention IMEWASHWA* – ujumbe unaomention mtu yeyote, namba za simu, au group mention utafutwa.' + FOOTER, quoted: message });
    } else if (sub === 'off') {
        data.groups[chatId].enabled = false;
        saveData(data);
        await sock.sendMessage(chatId, { text: '🔓 *Anti‑mention IMEZIMWA*' + FOOTER, quoted: message });
    } else {
        const status = data.groups[chatId].enabled ? 'IMEWASHWA' : 'IMEZIMWA';
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑mention*\nHali: ${status}\n\nMatumizi: .antimention on/off` + FOOTER, quoted: message });
    }
}

async function handleMentionCheck(sock, chatId, message) {
    const data = loadData();
    if (!data.groups[chatId] || !data.groups[chatId].enabled) return;

    let messageText = '';
    if (message.message?.conversation) messageText = message.message.conversation;
    else if (message.message?.extendedTextMessage?.text) messageText = message.message.extendedTextMessage.text;
    else if (message.message?.imageMessage?.caption) messageText = message.message.imageMessage.caption;
    else if (message.message?.videoMessage?.caption) messageText = message.message.videoMessage.caption;

    const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const hasAnyMention = mentionedJids.length > 0;
    const hasViolatingText = isTextViolating(messageText);

    if (hasAnyMention || hasViolatingText) {
        try {
            await sock.sendMessage(chatId, { delete: message.key });
        } catch (err) {
            console.error('Failed to delete message:', err);
        }
        const warning = `⚠️ *Anti‑mention*\nUjumbe wako umeondolewa kwa sababu ulijumuisha tag, namba ya simu, au group mention.` + FOOTER;
        await sock.sendMessage(chatId, { text: warning });
    }
}

module.exports = { antimentionCommand, handleMentionCheck, isTextViolating };