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

// Your 9 images (exactly in the order you gave)
const MENU_IMAGES = [
    'https://files.catbox.moe/uii8bi.jpg',
    'https://files.catbox.moe/69csjf.jpg',
    'https://files.catbox.moe/69csjf.jpg',  // duplicate as per your list
    'https://files.catbox.moe/wz28nv.jpg',
    'https://files.catbox.moe/07brl4.jpg',
    'https://files.catbox.moe/uii8bi.jpg',
    'https://files.catbox.moe/dhl8dp.jpg',
    'https://files.catbox.moe/n6adzs.jpg',
    'https://files.catbox.moe/gom02i.jpg'
];

// Store per‑user which image index they are on
const userImageIndex = new Map(); // userId -> index (0..8)

// --------------------- Sleep helper ---------------------
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --------------------- Rich main menu text (mini‑menus + bot info + owner) ---------------------
function getRichMainMenuText(pushname, mention, ping, ramBar, ramPercent, runtime, version, totalCommands) {
    const ownerNumber = "255777580820";
    const ownerName = "bigmanj tech";
    
    return `
╭━━〔 *🌟 BIGMANJ BOT V3 MAIN MENU* 〕━━⬣
┃ ${getGreeting()} @${mention} (${pushname})
┃
┃ ── *📋 MINI MENUS* ──
┃
┃ 🔹 \`.menu-ai\`       – AI & ChatGPT (chat, image, voice)
┃ 🔹 \`.menu-download\` – Media downloader (YT, TikTok, IG)
┃ 🔹 \`.menu-games\`    – Fun games (trivia, 8ball, RPS)
┃ 🔹 \`.menu-tools\`    – Utility tools (weather, calc, QR)
┃ 🔹 \`.menu-owner\`    – Owner panel (restricted)
┃ 🔹 \`.menu-info\`     – Bot stats & credits
┃
┃ ── *🤖 BOT INFO* ──
┃ 🚀 Ping      : ${ping}ms
┃ 💾 RAM       : ${ramBar} ${ramPercent}%
┃ ⏱️ Uptime    : ${runtime}
┃ 📦 Version   : ${version}
┃ 📚 Commands  : ${totalCommands}
┃
┃ ── *👑 OWNER* ──
┃ Name  : ${ownerName}
┃ Phone : wa.me/${ownerNumber}
┃
┃ ── *✨ FEATURES* ──
┃ 🔐 Russian Cyber Security Mode – активен
┃ 🧠 Premium AI Assistant (GPT‑4)
┃ 🌑 Dark Futuristic UI
┃ 🎵 MP3 audio & voice tools
┃ 📸 Cycling menu images (each .menu gives a new image)
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣

💡 *Type any .menu-xxx command above* to open a mini‑menu.
🎵 *Audio menu guide* will play in a moment...
    `.trim();
}

// --------------------- Send MP3 audio (normal audio, not voice note) ---------------------
async function sendMp3Audio(sock, chatId, quotedMsg) {
    // ⚠️ REPLACE THIS URL WITH YOUR ACTUAL MP3 FILE
    const audioUrl = 'https://files.catbox.moe/your-audio.mp3';
    try {
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: false   // normal audio, not voice note
        }, { quoted: quotedMsg });
    } catch (err) {
        console.error('MP3 audio send failed:', err.message);
        await sock.sendMessage(chatId, { text: '🔊 *Audio guide:* type .menu-ai for AI help, .menu-download for media, etc.' }, { quoted: quotedMsg });
    }
}

// --------------------- MAIN EXPORT: menuHandler (.menu command) ---------------------
const menuHandler = async (sock, chatId, m) => {
    const text = getMessageText(m).trim().toLowerCase();
    if (text !== '.menu') return;

    const senderId = m.key.participant || m.key.remoteJid;
    const pushname = m.pushName || "User";
    const isOwner = (senderId.split('@')[0] === "255777580820");
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

    // ---------- Get the current image index for this user ----------
    let currentIndex = userImageIndex.get(senderId) || 0;
    const currentImageUrl = MENU_IMAGES[currentIndex];
    
    // Calculate next index for next .menu
    const nextIndex = (currentIndex + 1) % MENU_IMAGES.length;
    userImageIndex.set(senderId, nextIndex);

    // ---------- 1. Send the cycling image (no extra caption, but you can add one) ----------
    // Optional: add a tiny caption like "Menu image #X"
    try {
        await sock.sendMessage(chatId, {
            image: { url: currentImageUrl },
            caption: `🎴 *Menu image ${currentIndex + 1}/${MENU_IMAGES.length}*`
        }, { quoted: m });
    } catch (err) {
        console.error('Cycling image send failed:', err.message);
    }

    // ---------- 2. Send the rich text menu (mini‑menus, bot info, owner, features) ----------
    const richMenuText = getRichMainMenuText(pushname, mention, ping, ramBar, ramPercent, runtime, version, totalCommands);
    await sock.sendMessage(chatId, { text: richMenuText, mentions: [senderId] }, { quoted: m });

    // ---------- 3. Wait 0.1 second, then send MP3 audio ----------
    await sleep(100);
    await sendMp3Audio(sock, chatId, m);
};

module.exports = menuHandler;