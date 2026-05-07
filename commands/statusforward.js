const fs = require('fs/promises');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const isOwnerOrSudo = require('../lib/isOwner');
const settings = require('../settings');

// ────────────────────────────────────────────────
const CONFIG_FILE = path.join(__dirname, '../data/statusforward.json');
const SYNC_DELAY = settings.syncDelay || 6;

let BOT_NUMBER = null;
let TARGET_JID = null;

// ⚡ DEFAULT ZOTE ZIPO ON HAPA
const DEFAULT_CONFIG = Object.freeze({
    enabled: true,        // Status Forwarding: ON
    autoRead: true,       // Auto View: ON
    autoLike: true,       // Auto Like: ON
    likeEmoji: '💚',      // Default Emoji
    forwardDelayMinMs: SYNC_DELAY * 200,
    forwardDelayMaxMs: SYNC_DELAY * 600,
    retryAttempts: 2,
    maxProcessedCache: 2500
});

let configCache = null;
const processedStatusIds = new Set();

// ────────────────────────────────────────────────
async function loadConfig() {
    if (configCache) return configCache;
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        // Merge saved data with defaults to ensure new keys (like autoRead/Like) are present
        configCache = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    } catch (err) {
        configCache = { ...DEFAULT_CONFIG };
        await saveConfig(configCache);
    }
    return configCache;
}

async function saveConfig(updates) {
    configCache = { ...configCache, ...updates };
    try {
        const dir = path.dirname(CONFIG_FILE);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(CONFIG_FILE, JSON.stringify(configCache, null, 2));
    } catch (err) {
        console.error('[StatusManager] Save config failed', err.message);
    }
}

// ────────────────────────────────────────────────
function extractPhoneNumber(key) {
    if (!key) return 'unknown';
    const jid = key.participant || key.remoteJid || '';
    const match = jid.match(/^(\d{9,15})/);
    return match ? match[1] : 'unknown';
}

function getFormattedTime() {
    return new Date().toLocaleString('sw-TZ', {
        timeZone: 'Africa/Dar_es_Salaam',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ────────────────────────────────────────────────
async function processStatusAction(sock, msg) {
    if (!msg?.message || !msg.key?.id) return;

    const cfg = await loadConfig();
    const msgId = msg.key.id;
    const remoteJid = msg.key.remoteJid;
    const participant = msg.key.participant || remoteJid;

    if (processedStatusIds.has(msgId)) return;
    processedStatusIds.add(msgId);

    // ✅ 1. AUTO VIEW (Imewashwa)
    if (cfg.autoRead) {
        try {
            await sock.readMessages([msg.key]);
            console.log(`[View] Status: ${extractPhoneNumber(msg.key)} checked.`);
        } catch (e) { }
    }

    // ✅ 2. AUTO LIKE (Imewashwa na 💚)
    if (cfg.autoLike) {
        try {
            await sock.sendMessage('status@broadcast', {
                react: { key: msg.key, text: cfg.likeEmoji }
            }, { statusJidList: [participant] });
            console.log(`[Like] Status: ${extractPhoneNumber(msg.key)} liked.`);
        } catch (e) { }
    }

    // ✅ 3. FORWARD LOGIC (Imewashwa)
    if (!cfg.enabled) return;

    if (!TARGET_JID) {
        if (sock.user?.id) {
            BOT_NUMBER = sock.user.id.split(':')[0];
            TARGET_JID = `${BOT_NUMBER}@s.whatsapp.net`;
        } else return;
    }

    const isImage = !!msg.message?.imageMessage;
    const isVideo = !!msg.message?.videoMessage;
    if (!isImage && !isVideo) return;

    let senderName = extractPhoneNumber(msg.key);
    let captionText = (isImage ? msg.message.imageMessage.caption : msg.message.videoMessage.caption) || '';

    const timeStr = getFormattedTime();
    const caption = [
        '✨ *New Status Forward* ✨',
        '──────────────────────',
        `👤 **${senderName}**`,
        `🕒 ${timeStr}`,
        captionText ? `💬 ${captionText.trim()}` : null,
        '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈',
        `Aina: ${isImage ? 'Picha' : 'Video'}`
    ].filter(Boolean).join('\n');

    let buffer = null;
    try {
        buffer = await downloadMediaMessage(msg, 'buffer', {}, {
            logger: console,
            reuploadRequest: sock.updateMediaMessage
        });
    } catch (err) { }

    if (buffer && buffer.length > 800) {
        await sock.sendMessage(TARGET_JID, {
            [isImage ? 'image' : 'video']: buffer,
            mimetype: isImage ? 'image/jpeg' : 'video/mp4',
            caption: caption
        });
    }
}

// ────────────────────────────────────────────────
async function handleStatusForward(sock, ev) {
    const cfg = await loadConfig();
    if (!ev.messages?.length) return;

    const m = ev.messages[0];
    if (m.key?.remoteJid !== 'status@broadcast' || !m.message) return;

    try {
        await new Promise(r => setTimeout(r, randomDelay(cfg.forwardDelayMinMs, cfg.forwardDelayMaxMs)));
        await processStatusAction(sock, m);
    } catch (err) {
        console.error('[Status Manager Error]', err.message);
    }
}

// ────────────────────────────────────────────────
async function statusForwardCommand(sock, chatId, msg, args = []) {
    const sender = msg.key.participant || msg.key.remoteJid;
    const isAllowed = msg.key.fromMe || (await isOwnerOrSudo(sender, sock, chatId));

    if (!isAllowed) return sock.sendMessage(chatId, { text: '⛔ Command hii ni ya owner tu' });

    const cfg = await loadConfig();
    const cmd = args[0]?.toLowerCase();

    if (!cmd) {
        return sock.sendMessage(chatId, {
            text: `📊 *STATUS MANAGER (ALL ON)*\n\n` +
                  `Forwarding : ${cfg.enabled ? '✅ ON' : '❌ OFF'}\n` +
                  `Auto View  : ${cfg.autoRead ? '✅ ON' : '❌ OFF'}\n` +
                  `Auto Like  : ${cfg.autoLike ? '✅ ON' : '❌ OFF'}\n` +
                  `Like Emoji : ${cfg.likeEmoji}\n\n` +
                  `*Amri za kuzima:* \n` +
                  `.statusforward off (Zima zote)\n` +
                  `.statusforward read (Zima/Washa View tu)\n` +
                  `.statusforward like (Zima/Washa Like tu)`
        });
    }

    if (cmd === 'on') {
        await saveConfig({ enabled: true, autoRead: true, autoLike: true });
        return sock.sendMessage(chatId, { text: '✅ Zote zimewashwa (Forward, View, Like).' });
    }
    if (cmd === 'off') {
        await saveConfig({ enabled: false, autoRead: false, autoLike: false });
        return sock.sendMessage(chatId, { text: '❌ Zote zimezimwa.' });
    }
    if (cmd === 'read') {
        const newState = !cfg.autoRead;
        await saveConfig({ autoRead: newState });
        return sock.sendMessage(chatId, { text: `👁️ Auto View sasa ni: ${newState ? 'ON' : 'OFF'}` });
    }
    if (cmd === 'like') {
        const newState = !cfg.autoLike;
        await saveConfig({ autoLike: newState });
        return sock.sendMessage(chatId, { text: `❤️ Auto Like sasa ni: ${newState ? 'ON' : 'OFF'}` });
    }

    return sock.sendMessage(chatId, { text: 'Amri haieleweki.' });
}

module.exports = {
    statusForwardCommand,
    handleStatusForward
};
