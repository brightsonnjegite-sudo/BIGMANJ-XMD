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
const OWNER_NAME = 'BIGMANj';
const OWNER_NUMBER = '255777580820';

// ----------------------------------- Multimedia URLs -----------------------------------
const VIDEO_NOTE_URL = 'https://files.catbox.moe/gaxx2h.mp4';
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

// ----------------------------------- Caching for video/voice (optional) -----------------------------------
let cachedVideo = null;
let cachedVoice = null;

async function getVideoBuffer() {
    if (cachedVideo) return cachedVideo;
    try {
        const res = await axios.get(VIDEO_NOTE_URL, { responseType: 'arraybuffer', timeout: 30000 });
        cachedVideo = Buffer.from(res.data);
        console.log('✅ Video note loaded, size:', cachedVideo.length);
        return cachedVideo;
    } catch (err) {
        console.error('❌ Video note error:', err.message);
        return null;
    }
}

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

async function sendVideoNote(sock, chatId, quotedMsg) {
    const buffer = await getVideoBuffer();
    if (!buffer) {
        console.log('⚠️ No video buffer – skipping video note');
        return;
    }
    try {
        await sock.sendMessage(chatId, {
            video: buffer,
            mimetype: 'video/mp4',
            ptt: true,
            fileLength: buffer.length
        }, { quoted: quotedMsg });
        console.log('🎥 Video note sent successfully');
    } catch (err) {
        console.error('❌ Video note send error:', err.message);
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

// ----------------------------------- Cyclic image + text menu -----------------------------------
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

    let caption = '';
    caption += `╭━━━〔 *BIGMANJ BOT V3* 〕━━━⬣\n`;
    caption += `┃ *.menu-general*\n`;
    caption += `┃ *.menu-group*\n`;
    caption += `┃ *.menu-security*\n`;
    caption += `┃ *.menu-ai*\n`;
    caption += `┃ *.menu-download*\n`;
    caption += `┃ *.menu-effects*\n`;
    caption += `┃ *.menu-owner*\n`;
    caption += `┃ *.menu-settings*\n`;
    caption += `┃ *.menu-tools*\n`;
    caption += `┃ *.menu-fun*\n`;
    caption += `┃ *.menu-automation*\n`;
    caption += `┃ *.menu-all*\n`;
    caption += `╰━━━━━━━━━━━━━━⬣\n\n`;
    caption += `${greeting} @${mention}\n\n`;
    caption += `🤖 *BIGMANJ BOT V3* – *WhatsApp Bot* developed in collaboration with *Ωuantum Base Developer*.\n\n`;
    caption += `🚀 *Speed:* ${latency}ms ${speedEmoji} (${speedStatus})\n`;
    caption += `👑 Owner : ${OWNER_NAME}\n`;
    caption += `📞 Owner No : ${OWNER_NUMBER}\n`;
    caption += `⚡ Commands : ${TOTAL_COMMANDS}\n`;
    caption += `📅 Date : ${date}\n`;
    caption += `⏰ Time : ${time}\n`;
    caption += `🚀 Runtime : ${runtime}\n\n`;
    caption += `> © bigmanj tech™`;

    try {
        await sock.sendMessage(chatId, {
            image: { url: imageUrl },
            caption: caption,
            mentions: [senderId]
        }, { quoted: m });
        console.log(`🖼️ Image menu sent (index ${currentImageIndex-1 >= 0 ? currentImageIndex-1 : IMAGE_URLS.length-1})`);
    } catch (err) {
        console.error('❌ Image menu send error:', err.message);
        // Fallback: send text-only menu
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

    // 1. Send video note
    await sendVideoNote(sock, chatId, m);
    // 2. Send voice note
    await sendVoiceNote(sock, chatId, m);
    // 3. Send image with menu text (cycles through images)
    await sendImageMenu(sock, chatId, m, senderId, latency);
};

module.exports = menuHandler;