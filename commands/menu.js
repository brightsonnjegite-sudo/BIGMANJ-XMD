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

*Tap the button below for Owner Menu*
    `.trim();

    // Send image + caption
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

    // Send a REAL interactive button (works on WhatsApp)
    const buttonMessage = {
        text: '🔽 *Mini Menu*',
        footer: 'BIGMANj BOT V3 — bigmanj tech ™',
        buttons: [
            {
                buttonId: 'owner_menu',        // This ID will be received when clicked
                buttonText: { displayText: '👑 Owner Menu' },
                type: 1
            }
        ],
        headerType: 1,
        viewOnce: false
    };

    try {
        await sock.sendMessage(chatId, buttonMessage, { quoted: m });
    } catch (err) {
        console.error('Button send failed:', err.message);
        // Fallback: text instruction
        await sock.sendMessage(chatId, { text: '🔽 Owner Menu: type `.owner`', mentions: [senderId] }, { quoted: m });
    }
};

module.exports = menuHandler;