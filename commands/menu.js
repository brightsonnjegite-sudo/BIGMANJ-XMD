const moment = require('moment-timezone');
const axios = require('axios');

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
const AUDIO_URL = 'https://files.catbox.moe/k3m90z.m4a';   // ✅ new audio link
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
    if (!buffer) return;
    try {
        await sock.sendMessage(chatId, { audio: buffer, mimetype: 'audio/mp4', ptt: true }, { quoted: quotedMsg });
    } catch (err) { console.error('Audio send error:', err.message); }
}

const sendMainMenu = async (sock, chatId, m, senderId, latency) => {
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
    caption += `╭━━━〔 *BIGMANj MD* 〕━━━⬣\n`;
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
    caption += `🤖 *BIGMANj MD* – *WhatsApp Bot* developed in collaboration with *Ωuantum Base Developer*.\n\n`;
    caption += `🚀 *Speed:* ${latency}ms ${speedEmoji} (${speedStatus})\n`;
    caption += `👑 Owner : ${OWNER_NAME}\n`;
    caption += `📞 Owner No : ${OWNER_NUMBER}\n`;
    caption += `⚡ Commands : ${TOTAL_COMMANDS}\n`;
    caption += `📅 Date : ${date}\n`;
    caption += `⏰ Time : ${time}\n`;
    caption += `🚀 Runtime : ${runtime}\n\n`;
    caption += `> bigmanj tech™`;

    await sock.sendMessage(chatId, {
        image: { url: 'https://i.ibb.co/GQDc1XMp/RD32363337313436343437363340732e77686174736170702e6e6574-828925.png' },
        caption: caption,
        mentions: [senderId]
    }, { quoted: m });

    setTimeout(() => sendAudio(sock, chatId, m), 2000);
};

const menuHandler = async (sock, chatId, m) => {
    const text = getMessageText(m).trim().toLowerCase();
    if (text !== '.menu') return;
    const senderId = m.key.participant || m.key.remoteJid;

    const startTime = Date.now();
    await sock.sendMessage(chatId, { react: { text: '📌', key: m.key } });
    const latency = Date.now() - startTime;

    await sendMainMenu(sock, chatId, m, senderId, latency);
};

module.exports = menuHandler;