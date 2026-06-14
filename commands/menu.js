const moment = require('moment-timezone');
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

// Orodha ya picha (za zamani + mpya)
const MENU_IMAGES = [
    'https://files.catbox.moe/uii8bi.jpg',
    'https://files.catbox.moe/69csjf.jpg',
    'https://files.catbox.moe/69csjf.jpg',
    'https://files.catbox.moe/wz28nv.jpg',
    'https://files.catbox.moe/07brl4.jpg',
    'https://files.catbox.moe/uii8bi.jpg',
    'https://files.catbox.moe/dhl8dp.jpg',
    'https://files.catbox.moe/n6adzs.jpg',
    'https://files.catbox.moe/gom02i.jpg',
    'https://files.catbox.moe/vvt57n.jpg',
    'https://files.catbox.moe/sp5pe9.jpg',
    'https://files.catbox.moe/x91kwx.jpg',
    'https://files.catbox.moe/8lz3ku.jpg',
    'https://files.catbox.moe/9yvg4v.jpg',
    'https://files.catbox.moe/1z5alt.jpg',
    'https://files.catbox.moe/5rsxjx.jpg',
    'https://files.catbox.moe/ke4n31.jpg',
    'https://files.catbox.moe/0s1yur.jpg',
    'https://files.catbox.moe/q01e2v.jpg',
    'https://files.catbox.moe/e0esva.jpg',
    'https://files.catbox.moe/x39ule.jpg'
];

const userImageIndex = new Map();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const menuHandler = async (sock, chatId, m) => {
    const text = getMessageText(m).trim().toLowerCase();
    if (text !== '.menu') return;

    const senderId = m.key.participant || m.key.remoteJid;
    const pushname = m.pushName || "User";
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
    const mention = getMentionNumber(senderId);
    const isOwner = (senderId.split('@')[0] === "255777580820");

    let currentIndex = userImageIndex.get(senderId) || 0;
    const currentImageUrl = MENU_IMAGES[currentIndex];
    const nextIndex = (currentIndex + 1) % MENU_IMAGES.length;
    userImageIndex.set(senderId, nextIndex);

    // ========== MAANDISHI YA MENU (yaliyopangwa) ==========
    const body = 
`✦ ${getGreeting()} @${pushname} ✦

╭──❍「 *User Info* 」❍
├ Status: ${isOwner ? "Owner" : "User"}
├ Name: @${pushname}
├ Prefix: Multiple
╰─┬────❍

╭─┴─❍「 *Bot Info* 」❍
├ Name: BIGMANJ BOT V3
├ Version: ${version}
├ Library: Baileys
├ Uptime: ${runtime}
├ Powered: bigmanj tech
├ Speed: ${(ping / 1000).toFixed(2)} s
├ Ram: [${ramBar}] ${ramPercent}%
╰─┬────❍

╭─┴─❍「 *Creators* 」❍
├ bigmanj tech
├ BIGMANj
╰─┬────❍

╭─┴─❍「 *About* 」❍
├ Reseller ®
├ Owner Ⓞ
├ Group Ⓖ
╰─┬────❍

╭─┴─❍「 *Mini Menus* 」❍
├ ⚙️ .menu-general
├ 👥 .menu-group
├ 🛡️ .menu-security
├ 🧠 .menu-ai
├ 📥 .menu-download
├ ✨ .menu-effects
├ 👑 .menu-owner
├ ⚙️ .menu-settings
├ 🔧 .menu-tools
├ 🎮 .menu-fun
├ 🤖 .menu-automation
├ 📚 .menu-all
╰──────❍

*Usage: .menu*
*Developed by bigmanj tech with ♡*`;

    const footer = "© BIGMANJ BOT V3 — by bigmanj tech";
    const buttons = [
        { buttonId: '.storemenu', buttonText: { displayText: '🛒 BIGMANj Store' }, type: 1 },
        { buttonId: '.teamsupport', buttonText: { displayText: '👥 Team Support' }, type: 1 }
    ];

    try {
        await sock.sendMessage(chatId, {
            image: { url: currentImageUrl },
            caption: body,
            footer: footer,
            buttons: buttons,
            headerType: 1
        }, { quoted: m });
    } catch (err) {
        console.error('Menu send failed:', err.message);
        await sock.sendMessage(chatId, { text: `${body}\n\n${footer}` }, { quoted: m });
    }

    await sleep(100);
    const audioUrl = 'https://files.catbox.moe/dvnn2a.mp3';
    try {
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: m });
    } catch (err) {
        console.error('MP3 audio send failed:', err.message);
    }
};

module.exports = menuHandler;