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
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
};

const getMentionNumber = (jid) => jid.split('@')[0];

const TOTAL_COMMANDS = 210;
const OWNER_NAME = 'bigmanj tech ';
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

// Global counter for cycling images (resets after last)
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
            ptt: true          // sends as voice note
        }, { quoted: quotedMsg });
        console.log('🎤 Voice note sent successfully');
    } catch (err) {
        console.error('❌ Voice note send error:', err.message);
    }
}

// ----------------------------------- Shortened menu text (shows "Read more") -----------------------------------
async function sendImageMenu(sock, chatId, m, senderId, latency) {
    // Get current image URL and cycle index for next time
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

    // SHORTENED MENU – only the essentials + a note to use submenus
    let caption = '';
    caption += `╭━━〔 *BIGMANJ BOT V3* 〕━━⬣\n`;
    caption += `┃${greeting} @${mention}\n`;
    caption += `┃🚀 Speed: ${latency}ms ${speedEmoji} (${speedStatus})\n`;
    caption += `┃👑 Owner: ${OWNER_NAME}\n`;
    caption += `┃📞 Owner No: ${OWNER_NUMBER}\n`;
    caption += `┃⚡ Commands: ${TOTAL_COMMANDS}\n`;
    caption += `┃📅 ${date}  ⏰ ${time}\n`;
    caption += `┃🚀 Runtime: ${runtime}\n`;
    caption += `╰━━━━━━━━━━━━━━━━━━⬣\n\n`;
    caption += `📌 *Type one of these:*\n`;
    caption += `▸ .menu-general\n▸ .menu-group\n▸ .menu-security\n▸ .menu-ai\n▸ .menu-download\n▸ .menu-effects\n▸ .menu-owner\n▸ .menu-settings\n▸ .menu-tools\n▸ .menu-fun\n▸ .menu-automation\n▸ .menu-all\n\n`;
    caption += `© bigmanj tech™ with ♥︎`;

    try {
        await sock.sendMessage(chatId, {
            image: { url: imageUrl },
            caption: caption,
            mentions: [senderId]
        }, { quoted: m });
        console.log(`🖼️ Image menu sent (index ${currentImageIndex-1 >= 0 ? currentImageIndex-1 : IMAGE_URLS.length-1})`);
    } catch (err) {
        console.error('❌ Image menu send error:', err.message);
        // Fallback: send text-only menu (also shortened)
        await sock.sendMessage(chatId, { text: caption, mentions: [senderId] }, { quoted: m });
    }
}

// ----------------------------------- Main menu handler -----------------------------------
const menuHandler = async (sock, chatId, m) => {
    const text = getMessageText(m).trim().toLowerCase();
    if (text !== '.menu') return;
    const senderId = m.key.participant || m.key.remoteJid;

    const startTime = Date.now();
    await sock.sendMessage(chatId, { react: { text: '📌', key: m.key } });
    const latency = Date.now() - startTime;

    // 1. Send image menu (shortened)
    await sendImageMenu(sock, chatId, m, senderId, latency);
    // 2. Send voice note (MP3) – after the menu
    await sendVoiceNote(sock, chatId, m);
};

module.exports = menuHandler;