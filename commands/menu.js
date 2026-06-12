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

// Picha – tumia URL moja thabiti (badilisha iwe yako)
const MENU_IMAGE_URL = 'https://files.catbox.moe/uii8bi.jpg';
// Sauti – URL yoyote ya mp3 inayofanya kazi
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

    // 1. Tuma picha pamoja na caption
    try {
        await sock.sendMessage(chatId, {
            image: { url: MENU_IMAGE_URL },
            caption: caption,
            mentions: [senderId]
        }, { quoted: m });
    } catch (err) {
        console.error('Image send failed:', err.message);
        // Fallback: tuma maandishi tu
        await sock.sendMessage(chatId, { text: caption, mentions: [senderId] }, { quoted: m });
    }

    // 2. Tuma maandishi yenye amri (badala ya buttons) – hizi ndizo amri ambazo bot yako tayari inazijua
    const navText = `📌 *Quick navigation*\n\n• *All Menu* – type \`.menu-all\`\n• *Owner Menu* – type \`.menu-owner\`\n\n© BIGMANJ BOT V3 — by bigmanj tech ™`;
    await sock.sendMessage(chatId, { text: navText, mentions: [senderId] }, { quoted: m });

    // 3. Tuma audio
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