const moment = require('moment-timezone');
const axios = require('axios');
const os = require('os');

// --------------------- Helper functions ---------------------
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

// Your 9 cycling images
const MENU_IMAGES = [
    'https://files.catbox.moe/uii8bi.jpg',
    'https://files.catbox.moe/69csjf.jpg',
    'https://files.catbox.moe/69csjf.jpg',
    'https://files.catbox.moe/wz28nv.jpg',
    'https://files.catbox.moe/07brl4.jpg',
    'https://files.catbox.moe/uii8bi.jpg',
    'https://files.catbox.moe/dhl8dp.jpg',
    'https://files.catbox.moe/n6adzs.jpg',
    'https://files.catbox.moe/gom02i.jpg'
];

// Store per‑user image index
const userImageIndex = new Map();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --------------------- FORCE "READ MORE" WITH ZERO-WIDTH SPACES ---------------------
function getReadMoreTrigger() {
    return '\u200b'.repeat(10000);
}

// --------------------- SMART MENU CAPTION (visible + hidden parts) ---------------------
function getSmartMenuCaption(pushname, mention, ping, ramBar, ramPercent, runtime, version, totalCommands) {
    const ownerNumber = "255777580820";
    const ownerName = "bigmanj tech";

    // --- VISIBLE PART (Bot info & Owner) ---
    const visiblePart = `
    〔 *🌟 BIGMANJ BOT V3* 〕
 ${getGreeting()} @${mention} (${pushname})

         🤖 *BOT INFO*
     🚀 Ping      : ${ping}ms
     💾 RAM       : ${ramBar} ${ramPercent}%
     ⏱️ Uptime    : ${runtime}
     📦 Version   : ${version}
     📚 Commands  : ${totalCommands}

          👑 *OWNER*
    💀 name: ${ownerName}
    📱 phone: wa.me/${ownerNumber}
    `.trim();

    // --- HIDDEN PART (Mini menus, Features, Footer) ---
    const hiddenPart = `
          📋 *MINI MENUS*
a  .menu-general
b  .menu-group
c  .menu-security
d  .menu-ai
e  .menu-download
f  .menu-effects
g  .menu-owner
h  .menu-settings
i  .menu-tools
j  .menu-fun
k  .menu-automation
l  .menu-all

         ✨ *FEATURES*
🔐 Russian Cyber Security Mode
🧠 Premium AI Assistant (GPT‑4)
🌑 Dark Futuristic UI
🎵 MP3 audio & voice tools
📸 Dynamic menu images
> script 📃 under construction 🚧

 '© bigmanj tech ™ with ♥︎',
    `.trim();

    const readMoreTrigger = getReadMoreTrigger();
    return `${visiblePart}${readMoreTrigger}${hiddenPart}`;
}

// --------------------- Send MP3 audio (normal, not voice note) ---------------------
async function sendMp3Audio(sock, chatId, quotedMsg) {
    const audioUrl = 'https://files.catbox.moe/sc2tlj.mp3';
    try {
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: quotedMsg });
    } catch (err) {
        console.error('MP3 audio send failed:', err.message);
        await sock.sendMessage(chatId, { text: '🔊 Audio guide: use .menu-ai for AI, .menu-download for media, etc.' }, { quoted: quotedMsg });
    }
}

// --------------------- MAIN EXPORT (menu command) ---------------------
const menuHandler = async (sock, chatId, m) => {
    const text = getMessageText(m).trim().toLowerCase();
    if (text !== '.menu') return;

    const senderId = m.key.participant || m.key.remoteJid;
    const pushname = m.pushName || "User";
    const start = Date.now();
    await sock.sendMessage(chatId, { react: { text: '📌', key: m.key } });
    const ping = Date.now() - start;

    // System stats
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = Math.round((usedMem / totalMem) * 100);
    const ramBar = "█".repeat(Math.round(ramPercent / 10)) + "░".repeat(10 - Math.round(ramPercent / 10));
    const runtime = formatUptime(process.uptime());
    const version = "3.0.0";
    const totalCommands = 210;
    const mention = getMentionNumber(senderId);

    // Cycle image index per user
    let currentIndex = userImageIndex.get(senderId) || 0;
    const currentImageUrl = MENU_IMAGES[currentIndex];
    const nextIndex = (currentIndex + 1) % MENU_IMAGES.length;
    userImageIndex.set(senderId, nextIndex);

    // Build full caption with "Read more"
    const caption = getSmartMenuCaption(pushname, mention, ping, ramBar, ramPercent, runtime, version, totalCommands);

    // Send image + caption
    try {
        await sock.sendMessage(chatId, {
            image: { url: currentImageUrl },
            caption: caption,
            mentions: [senderId]
        }, { quoted: m });
    } catch (err) {
        console.error('Menu image send failed:', err.message);
        await sock.sendMessage(chatId, { text: caption, mentions: [senderId] }, { quoted: m });
    }

    // Send audio after 0.1 seconds
    await sleep(100);
    await sendMp3Audio(sock, chatId, m);
};

module.exports = menuHandler;