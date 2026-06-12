const moment = require('moment-timezone');
const axios = require('axios');

// ----------------------------------- Helper functions -----------------------------------
const getMessageText = (m) => {
    if (m.message?.conversation) return m.message.conversation;
    if (m.message?.extendedTextMessage?.text) return m.message.extendedTextMessage.text;
    return '';
};

const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
};

const getGreeting = () => {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Good morning';
    if (hour >= 12 && hour < 18) return '🌤️ Good afternoon';
    return '🌙 Good evening';
};

const getMentionNumber = (jid) => jid.split('@')[0];

const TOTAL_COMMANDS = 210;
const OWNER_NAME = 'BIGMANj';
const OWNER_NUMBER = '255777580820';

// ----------------------------------- Multimedia URLs -----------------------------------
const VOICE_NOTE_URL = 'https://files.catbox.moe/sc2tlj.mp3';

// Cyclic image URLs (8 images)
const IMAGE_URLS = [
    'https://files.catbox.moe/rt3wya.jpg',
    'https://files.catbox.moe/69csjf.jpg',
    'https://files.catbox.moe/wz28nv.jpg',
    'https://files.catbox.moe/07brl4.jpg',
    'https://files.catbox.moe/uii8bi.jpg',
    'https://files.catbox.moe/dhl8dp.jpg',
    'https://files.catbox.moe/n6adzs.jpg',
    'https://files.catbox.moe/gom02i.jpg'
];

// Global counter for cycling images
let currentImageIndex = 0;

// Cache for voice buffer
let cachedVoice = null;

async function getVoiceBuffer() {
    if (cachedVoice) return cachedVoice;
    try {
        const res = await axios.get(VOICE_NOTE_URL, { responseType: 'arraybuffer', timeout: 30000 });
        cachedVoice = Buffer.from(res.data);
        console.log('✅ Voice note loaded, size:', cachedVoice.length);
        return cachedVoice;
    } catch (err) {
        console.error('❌ Voice note error:', err.message);
        return null;
    }
}

async function sendVoiceNote(sock, chatId, quotedMsg) {
    const buffer = await getVoiceBuffer();
    if (!buffer) {
        console.log('⚠️ No voice buffer – skipping voice note');
        return;
    }
    try {
        await sock.sendMessage(chatId, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            ptt: true
        }, { quoted: quotedMsg });
        console.log('🎤 Voice note sent successfully');
    } catch (err) {
        console.error('❌ Voice note send error:', err.message);
    }
}

// ----------------------------------- Menu with English caption, correct footer, no foreign branding -----------------------------------
async function sendImageMenu(sock, chatId, m, senderId, latency) {
    const imageUrl = IMAGE_URLS[currentImageIndex];
    currentImageIndex = (currentImageIndex + 1) % IMAGE_URLS.length;

    moment.tz.setDefault('Africa/Dar_es_Salaam');
    const now = moment();
    const greeting = getGreeting();
    const mention = getMentionNumber(senderId);
    const runtime = formatUptime(process.uptime());
    const date = now.format('DD/MM/YYYY');
    const time = now.format('HH:mm:ss');

    const speedEmoji = latency < 100 ? '🚀' : (latency < 300 ? '⚡' : '🐢');
    const speedStatus = latency < 100 ? 'Excellent' : (latency < 300 ? 'Good' : 'Slow');

    // Clean English caption – no Zero Trash / Ghost
    let caption = '';
    caption += `╭━━〔 *BIGMANJ BOT V3* 〕━━⬣\n`;
    caption += `┃${greeting} @${mention}\n`;
    caption += `┃🤖 WhatsApp automation tool\n`;
    caption += `┃🔧 Make your WhatsApp smarter\n`;
    caption += `╰━━━━━━━━━━━━━━━━━━⬣\n\n`;
    caption += `📌 *User Info*\n`;
    caption += `   • Status: User\n`;
    caption += `   • Name: @${mention}\n`;
    caption += `   • Prefix: .\n\n`;
    caption += `📌 *Bot Info*\n`;
    caption += `   • Speed: ${latency}ms ${speedEmoji} (${speedStatus})\n`;
    caption += `   • Uptime: ${runtime}\n`;
    caption += `   • Commands: ${TOTAL_COMMANDS}\n`;
    caption += `   • Date: ${date} | Time: ${time}\n\n`;
    caption += `📌 *Sub‑menus*\n`;
    caption += `   .menu-general    .menu-group\n`;
    caption += `   .menu-security   .menu-ai\n`;
    caption += `   .menu-download   .menu-effects\n`;
    caption += `   .menu-owner      .menu-settings\n`;
    caption += `   .menu-tools      .menu-fun\n`;
    caption += `   .menu-automation  .menu-all\n\n`;
    // Footer as requested
    caption += `~bigmanj tech~\n`;
    caption += `© bigmanj tech ™\n`;
    caption += `~*BIGMANJ BOT V3*~ by ~*© bigmanj tech ™ with ♥︎*~`;

    try {
        await sock.sendMessage(chatId, {
            image: { url: imageUrl },
            caption: caption,
            mentions: [senderId]
        }, { quoted: m });
        console.log(`🖼️ Menu image sent (index ${(currentImageIndex-1+IMAGE_URLS.length)%IMAGE_URLS.length})`);
    } catch (err) {
        console.error('❌ Image menu send error:', err.message);
        await sock.sendMessage(chatId, { text: caption, mentions: [senderId] }, { quoted: m });
    }
}

// ----------------------------------- Main handler -----------------------------------
const menuHandler = async (sock, chatId, m) => {
    const text = getMessageText(m).trim().toLowerCase();
    if (text !== '.menu') return;
    const senderId = m.key.participant || m.key.remoteJid;

    const startTime = Date.now();
    await sock.sendMessage(chatId, { react: { text: '📌', key: m.key } });
    const latency = Date.now() - startTime;

    // 1. Send image menu (with new English caption and correct footer)
    await sendImageMenu(sock, chatId, m, senderId, latency);
    // 2. Send voice note after menu
    await sendVoiceNote(sock, chatId, m);
};

module.exports = menuHandler;