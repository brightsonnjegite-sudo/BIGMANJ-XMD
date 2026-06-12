const moment = require('moment-timezone');
const axios = require('axios');

// Helper functions
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
const OWNER_NAME = 'bigmanj tech';
const OWNER_NUMBER = '255777580820';

// Audio URL (working MP3)
const AUDIO_URL = 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3';

// Cyclic images (8 images)
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

let currentImageIndex = 0;
let cachedAudio = null;

async function getAudioBuffer() {
    if (cachedAudio) return cachedAudio;
    try {
        const res = await axios.get(AUDIO_URL, { responseType: 'arraybuffer', timeout: 30000 });
        cachedAudio = Buffer.from(res.data);
        console.log('✅ Audio loaded');
        return cachedAudio;
    } catch (err) {
        console.error('❌ Audio error:', err.message);
        return null;
    }
}

async function sendAudio(sock, chatId, quotedMsg) {
    const buffer = await getAudioBuffer();
    if (!buffer) {
        await sock.sendMessage(chatId, { text: "🔊 Audio unavailable." }, { quoted: quotedMsg });
        return;
    }
    try {
        await sock.sendMessage(chatId, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: 'menu_audio.mp3'
        }, { quoted: quotedMsg });
        console.log('🎵 Audio sent');
    } catch (err) {
        console.error('❌ Audio send error:', err.message);
    }
}

// ----- CLEAN, SIMPLE MENU (no ugly boxes) -----
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

    // Clean, minimalist caption (no box drawing characters)
    let caption = '';
    caption += `⚠️ *ДОСТУП РАЗРЕШЁН* ⚠️\n`;
    caption += `*BIGMANJ BOT V3*\n`;
    caption += `Скорость выше предела. Интеллект без границ. Мощь нового поколения.\n`;
    caption += `*СТАТУС:* АКТИВЕН   *РЕЖИМ:* ЭЛИТА\n\n`;
    caption += `${greeting} @${mention}\n\n`;
    caption += `📌 *User Info*\n`;
    caption += `• Status: User\n`;
    caption += `• Name: @${mention}\n`;
    caption += `• Prefix: .\n\n`;
    caption += `📌 *Bot Info*\n`;
    caption += `• Speed: ${latency}ms ${speedEmoji} (${speedStatus})\n`;
    caption += `• Uptime: ${runtime}\n`;
    caption += `• Commands: ${TOTAL_COMMANDS}\n`;
    caption += `• Date: ${date} | Time: ${time}\n\n`;
    caption += `📌 *Sub‑menus*\n`;
    caption += `• .menu-general\n• .menu-group\n• .menu-security\n• .menu-ai\n`;
    caption += `• .menu-download\n• .menu-effects\n• .menu-owner\n• .menu-settings\n`;
    caption += `• .menu-tools\n• .menu-fun\n• .menu-automation\n• .menu-all\n\n`;
    caption += `~bigmanj tech~\n`;
    caption += `© bigmanj tech ™\n`;
    caption += `~*BIGMANJ BOT V3*~ by ~*© bigmanj tech ™ with ♥︎*~`;

    try {
        await sock.sendMessage(chatId, {
            image: { url: imageUrl },
            caption: caption,
            mentions: [senderId]
        }, { quoted: m });
        console.log(`🖼️ Menu image sent (${currentImageIndex-1 >= 0 ? currentImageIndex-1 : IMAGE_URLS.length-1})`);
    } catch (err) {
        console.error('❌ Image error:', err.message);
        await sock.sendMessage(chatId, { text: caption, mentions: [senderId] }, { quoted: m });
    }
}

// Main handler
const menuHandler = async (sock, chatId, m) => {
    const text = getMessageText(m).trim().toLowerCase();
    if (text !== '.menu') return;
    const senderId = m.key.participant || m.key.remoteJid;

    const startTime = Date.now();
    await sock.sendMessage(chatId, { react: { text: '📌', key: m.key } });
    const latency = Date.now() - startTime;

    await sendImageMenu(sock, chatId, m, senderId, latency);
    await sendAudio(sock, chatId, m);
};

module.exports = menuHandler;