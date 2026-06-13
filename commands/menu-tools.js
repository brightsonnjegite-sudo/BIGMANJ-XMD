const moment = require('moment-timezone');

const getMentionNumber = (jid) => jid.split('@')[0];

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
    
    // Orodha ya commands
    const commands = [
        '.toimg', '.autourl', '.audiourl', '.url', '.tourl', '.getcode',
        '.getlink', '.qr', '.emojimix', '.emix', '.stickertelegram', '.tg',
        '.tgsticker', '.telesticker', '.viewonce', '.vv', '.sticker', '.s',
        '.stickeralt', '.gpstatus', '.tts', '.delete', '.del', '.report',
        '.weather', '.halotel', '.topmembers', '.character', '.stats', '.repo'
    ];

    // Tengeneza caption kwa herufi a, b, c...
    let caption = `${greeting} @${pushname}\n\n🔧 *TOOLS MENU*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < commands.length; i++) {
        const letter = alphabet[i] || (i + 1);
        caption += `${letter}. ${commands[i]}\n`;
    }
    caption += `\n💡 Useful tools for daily tasks.\n🚀 *BIGMANJ BOT V3* — Fast • Powerful • Reliable\n\n© bigmanj tech ™ with ♥︎`;

    await sock.sendMessage(chatId, { 
        text: caption, 
        mentions: [senderId]
    }, { quoted: m });
    
    await sock.sendMessage(chatId, { react: { text: '🔧', key: m.key } });
};

module.exports = handler;