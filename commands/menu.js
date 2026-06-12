const moment = require('moment-timezone');
const axios = require('axios');
const os = require('os');

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
    if (hour >= 5 && hour < 12) return '🌅 Доброе утро';
    if (hour >= 12 && hour < 18) return '🌤️ Добрый день';
    return '🌙 Добрый вечер';
};

const getMentionNumber = (jid) => jid.split('@')[0];

const MENU_IMAGE_URL = 'https://files.catbox.moe/uii8bi.jpg';
const AUDIO_URL = 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3';

let cachedAudio = null;

async function getAudioBuffer() {
    if (cachedAudio) return cachedAudio;
    try {
        const res = await axios.get(AUDIO_URL, { responseType: 'arraybuffer', timeout: 30000 });
        cachedAudio = Buffer.from(res.data);
        return cachedAudio;
    } catch (err) {
        console.error('Audio error:', err.message);
        return null;
    }
}

// Helper to send interactive buttons (two buttons)
async function sendMiniMenuButtons(sock, chatId, senderId, quotedMsg) {
    const buttons = [
        {
            buttonId: '.menu-all',
            buttonText: { displayText: '📂 All Menu' },
            type: 1
        },
        {
            buttonId: '.menu-owner',
            buttonText: { displayText: '👑 Owner Menu' },
            type: 1
        }
    ];
    const buttonMessage = {
        text: '🔽 *Choose a mini menu:*',
        footer: 'BIGMANj BOT V3 — bigmanj tech ™',
        buttons: buttons,
        headerType: 1,
        mentions: [senderId]
    };
    try {
        await sock.sendMessage(chatId, buttonMessage, { quoted: quotedMsg });
    } catch (err) {
        console.error('Button send failed:', err.message);
        // Fallback: send as plain text
        await sock.sendMessage(chatId, { 
            text: '🔽 Mini menus:\n• Type `.menu-all` for All Menu\n• Type `.menu-owner` for Owner Menu',
            mentions: [senderId]
        }, { quoted: quotedMsg });
    }
}

const menuHandler = async (sock, chatId, m) => {
    const text = getMessageText(m).trim().toLowerCase();
    if (text !== '.menu') return;

    const senderId = m.key.participant || m.key.remoteJid;
    const pushname = m.pushName || "User";
    const isOwner = (senderId.split('@')[0] === "255777580820");
    const status = isOwner ? "👑 OWNER" : "🤖 USER";
    const start = Date.now();
    await sock.sendMessage(chatId, { react: { text: '📌', key: m.key } });
    const ping = Date.now() - start;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = Math.round((usedMem / totalMem) * 100);
    const ramBar = "█".repeat(Math.round(ramPercent / 10)) + "░".repeat(10 - Math.round(ramPercent / 10));
    const runtime = formatUptime(process.uptime());
    const version = "3.0.0";
    const totalCommands = 210;
    const library = "Baileys";
    const ownerName = "bigmanj tech";
    const greeting = getGreeting();
    const mention = getMentionNumber(senderId);

    const caption = `
╭━━〔 *⚡ BIGMANJ BOT V3 ⚡* 〕━━⬣
┃ ${greeting} @${mention}
┃ 👤 *User* : ${pushname}
┃ ⚡ *Status* : ${status}
┃ 🚀 *Ping* : ${ping}ms
┃ 💾 *RAM* : ${ramBar} ${ramPercent}%
┃ ⏱ *Runtime* : ${runtime}
┃ 🤖 *Bot Version* : ${version}
┃ 📚 *Commands* : ${totalCommands}
┃ 📡 *Library* : ${library}
┃ 👑 *Owner* : ${ownerName}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━⬣

🔐 *Russian Cyber Security Mode* – активен
✨ *Premium AI Assistant* – готов
🌑 *Dark Futuristic UI* – загружен

*Используйте команды ниже для навигации*
    `.trim();

    // 1. Send main menu image + caption
    try {
        await sock.sendMessage(chatId, {
            image: { url: MENU_IMAGE_URL },
            caption: caption,
            mentions: [senderId]
        }, { quoted: m });
    } catch (err) {
        console.error('Image send failed:', err.message);
        await sock.sendMessage(chatId, { text: caption, mentions: [senderId] }, { quoted: m });
    }

    // 2. Send button message (two mini‑menu buttons)
    await sendMiniMenuButtons(sock, chatId, senderId, m);

    // 3. Send audio
    const audioBuffer = await getAudioBuffer();
    if (audioBuffer) {
        await sock.sendMessage(chatId, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: 'menu_audio.mp3'
        }, { quoted: m });
    }
};

module.exports = menuHandler;