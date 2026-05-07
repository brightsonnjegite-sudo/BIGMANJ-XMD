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

const DEFAULT_CONFIG = Object.freeze({
    enabled: true,        
    autoRead: true,       
    autoLike: true,       
    likeEmoji: '💚',      
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

// 🛡️ [BORESHO]: Kupata namba au Jina la Mtumaji bila Error
function extractSenderInfo(m) {
    if (!m || !m.key) return { jid: 'unknown', name: 'Mshkaji' };
    const jid = m.key.participant || m.key.remoteJid || 'unknown';
    const name = m.pushName || jid.split('@')[0] || 'Mshkaji';
    return { jid, name };
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
    
    // 🛡️ Kupata Sender info kwa usalama
    const { jid: participant, name: senderName } = extractSenderInfo(msg);

    if (processedStatusIds.has(msgId)) return;
    processedStatusIds.add(msgId);

    // ✅ 1. AUTO VIEW
    if (cfg.autoRead) {
        try {
            await sock.readMessages([msg.key]);
            console.log(`[View] Status from: ${senderName} checked.`);
        } catch (e) { }
    }

    // ✅ 2. AUTO LIKE (💚)
    if (cfg.autoLike) {
        try {
            await sock.sendMessage('status@broadcast', {
                react: { key: msg.key, text: cfg.likeEmoji }
            }, { statusJidList: [participant] });
            console.log(`[Like] Status from: ${senderName} liked.`);
        } catch (e) { }
    }

    // ✅ 3. FORWARD LOGIC
    if (!cfg.enabled) return;

    if (!TARGET_JID) {
        if (sock.user?.id) {
            BOT_NUMBER = sock.user.id.split(':')[0].split('@')[0];
            TARGET_JID = `${BOT_NUMBER}@s.whatsapp.net`;
        } else return;
    }

    const isImage = !!msg.message?.imageMessage;
    const isVideo = !!msg.message?.videoMessage;
    if (!isImage && !isVideo) return;

    let captionText = (isImage ? msg.message.imageMessage.caption : msg.message.videoMessage.caption) || '';
    const timeStr = getFormattedTime();

    const caption = [
        '✨ *Mickey Glitch Status Forward* ✨',
        '──────────────────────',
        `👤 **Mtumaji:** ${senderName}`,
        `🕒 **Muda:** ${timeStr}`,
        captionText ? `💬 **Caption:** ${captionText.trim()}` : null,
        '──────────────────────',
        `Aina: ${isImage ? '📸 Picha' : '🎥 Video'}`
    ].filter(Boolean).join('\n');

    try {
        const buffer = await downloadMediaMessage(msg, 'buffer', {}, {
            logger: console,
            reuploadRequest: sock.updateMediaMessage
        });

        if (buffer && buffer.length > 500) {
            await sock.sendMessage(TARGET_JID, {
                [isImage ? 'image' : 'video']: buffer,
                mimetype: isImage ? 'image/jpeg' : 'video/mp4',
                caption: caption
            });
        }
    } catch (err) {
        console.error('[Status Forward] Failed to download/send media:', err.message);
    }
}

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

async function statusForwardCommand(sock, chatId, msg, args = []) {
    const sender = msg.key.participant || msg.key.remoteJid;
    const isAllowed = msg.key.fromMe || (await isOwnerOrSudo(sender, sock, chatId));

    if (!isAllowed) return sock.sendMessage(chatId, { text: '⛔ Amri hii ni ya mwanangu Mickdadi tu!' });

    const cfg = await loadConfig();
    const cmd = args[0]?.toLowerCase();

    if (!cmd) {
        return sock.sendMessage(chatId, {
            text: `📊 *MICKEY STATUS MANAGER*\n\n` +
                  `Forwarding : ${cfg.enabled ? '✅ ON' : '❌ OFF'}\n` +
                  `Auto View  : ${cfg.autoRead ? '✅ ON' : '❌ OFF'}\n` +
                  `Auto Like  : ${cfg.autoLike ? '✅ ON' : '❌ OFF'}\n` +
                  `Emoji      : ${cfg.likeEmoji}\n\n` +
                  `*Matumizi:* \n` +
                  `.statusforward on/off\n` +
                  `.statusforward read\n` +
                  `.statusforward like`
        });
    }

    if (cmd === 'on') {
        await saveConfig({ enabled: true, autoRead: true, autoLike: true });
        return sock.sendMessage(chatId, { text: '✅ Features zote zimewashwa kwa mafanikio!' });
    }
    if (cmd === 'off') {
        await saveConfig({ enabled: false, autoRead: false, autoLike: false });
        return sock.sendMessage(chatId, { text: '❌ Zote zimezimwa mzee baba.' });
    }
    if (cmd === 'read') {
        const newState = !cfg.autoRead;
        await saveConfig({ autoRead: newState });
        return sock.sendMessage(chatId, { text: `👁️ Auto View: ${newState ? 'ON' : 'OFF'}` });
    }
    if (cmd === 'like') {
        const newState = !cfg.autoLike;
        await saveConfig({ autoLike: newState });
        return sock.sendMessage(chatId, { text: `💚 Auto Like: ${newState ? 'ON' : 'OFF'}` });
    }
}

module.exports = { statusForwardCommand, handleStatusForward };
