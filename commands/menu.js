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

const MENU_IMAGE_URL = 'https://files.catbox.moe/uii8bi.jpg';

// --------------------- Slideshow image URLs (your list) ---------------------
const SLIDESHOW_IMAGES = [
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

// --------------------- Sleep helper (for delays) ---------------------
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --------------------- Send slideshow images one by one ---------------------
async function sendImageSlideshow(sock, chatId, quotedMsg) {
    for (let i = 0; i < SLIDESHOW_IMAGES.length; i++) {
        try {
            await sock.sendMessage(chatId, {
                image: { url: SLIDESHOW_IMAGES[i] },
                caption: i === 0 ? '🎬 *Transition effect*' : undefined
            }, { quoted: quotedMsg });
            await sleep(500); // 0.5 second between images – adjust as you like
        } catch (err) {
            console.error(`Slideshow image ${i+1} failed:`, err.message);
        }
    }
}

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
┃ 📸 Image slideshow transition
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣

💡 *Type any .menu-xxx command above* to open a mini‑menu.
🎵 *Audio menu guide* will play in a moment...
    `.trim();
}

// --------------------- Send MP3 audio (normal audio, not voice note) ---------------------
async function sendMp3Audio(sock, chatId, quotedMsg) {
    // You can replace this URL with your own MP3 file
    const audioUrl = 'https://files.catbox.moe/your-audio.mp3';  // <-- CHANGE THIS TO YOUR MP3 URL
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

    const caption = `
╭━━〔 *⚡ BIGMANJ BOT V3 ⚡* 〕━━⬣
┃ ${getGreeting()} @${mention}
┃ 👤 *User* : ${pushname}
┃ ⚡ *Status* : ${isOwner ? "👑 OWNER" : "🤖 USER"}
┃ 🚀 *Ping* : ${ping}ms
┃ 💾 *RAM* : ${ramBar} ${ramPercent}%
┃ ⏱ *Runtime* : ${runtime}
┃ 🤖 *Bot Version* : ${version}
┃ 📚 *Commands* : ${totalCommands}
┃ 📡 *Library* : Baileys
┃ 👑 *Owner* : bigmanj tech
╰━━━━━━━━━━━━━━━━━━━━━━━━━━⬣

🔐 *Russian Cyber Security Mode* – активен
✨ *Premium AI Assistant* – готов
🌑 *Dark Futuristic UI* – загружен

*Tap the button below for Owner Menu*
    `.trim();

    // 1️⃣ Your existing status image + caption
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

    // 2️⃣ Your existing button (owner menu)
    const buttonMessage = {
        text: '🔽 *Mini Menu*',
        footer: 'BIGMANj BOT V3 — bigmanj tech ™',
        buttons: [
            {
                buttonId: 'owner_menu',
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
        await sock.sendMessage(chatId, { text: '🔽 Owner Menu: type `.owner`', mentions: [senderId] }, { quoted: m });
    }

    // 3️⃣ Send the rich text main menu (lists mini‑menus, bot info, owner, features)
    const richMenuText = getRichMainMenuText(pushname, mention, ping, ramBar, ramPercent, runtime, version, totalCommands);
    await sock.sendMessage(chatId, { text: richMenuText, mentions: [senderId] }, { quoted: m });

    // 4️⃣ Send image slideshow (transition effect) – runs one full cycle
    await sendImageSlideshow(sock, chatId, m);

    // 5️⃣ After 0.1 seconds, send MP3 audio (normal audio, not voice recording)
    await sleep(100);
    await sendMp3Audio(sock, chatId, m);
};

module.exports = menuHandler;