const moment = require('moment-timezone');

// Picha za main menu (zile zile 9)
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

// Hifadhi index ya picha kwa kila mtumiaji
const userImageIndex = new Map();

const getGreeting = () => {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
};

const handler = async (sock, chatId, m) => {
    const senderId = m.key.participant || m.key.remoteJid;
    const pushname = m.pushName || "User";
    const greeting = getGreeting();

    // Orodha ya commands za settings
    const commands = [
        '.autoread', '.autotyping', '.autostatus', '.areact', 
        '.setmention', '.groupmention', '.mention', '.antidelete', 
        '.pmblocker', '.anticall', '.settings'
    ];

    // Tengeneza caption (kwa sasa inatumia bullet •)
    let caption = `${greeting} @${pushname}\n\n⚙️ *SETTINGS MENU*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    for (const cmd of commands) caption += `• ${cmd}\n`;
    caption += `\n⚙️ Configure bot settings.\n🚀 *BIGMANJ BOT V3* — Fast • Powerful • Reliable\n\n© bigmanj tech ™ with ♥︎`;

    // Pata picha inayozunguka kwa mtumiaji huyu
    let currentIndex = userImageIndex.get(senderId) || 0;
    const currentImageUrl = MENU_IMAGES[currentIndex];
    const nextIndex = (currentIndex + 1) % MENU_IMAGES.length;
    userImageIndex.set(senderId, nextIndex);

    // Tuma picha pamoja na caption
    await sock.sendMessage(chatId, {
        image: { url: currentImageUrl },
        caption: caption,
        mentions: [senderId]
    }, { quoted: m });

    // Tuma reaction
    await sock.sendMessage(chatId, { react: { text: '⚙️', key: m.key } });
};

module.exports = handler;