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
    const greeting = getGreeting();
    const mention = getMentionNumber(senderId);
    const commands = ['.help', '.ping', '.alive', '.owner', '.repo', '.stats', '.settings', '.checkupdates', '.jid'];

    let caption = `✨ ΥΟ!!, @${mention}\n\n📂 GENERAL MENU\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    for (const cmd of commands) caption += `• ${cmd}\n`;
    caption += `\n🤖 General bot commands.\n🚀 *BIGMANj MD* — Fast • Powerful • Reliable\n\n> bigmanj tech™`;

    // Jaribu kutuma picha, ikishindwa tuma maandishi tu
    try {
        await sock.sendMessage(chatId, {
            image: { url: 'https://files.catbox.moe/g273hp.jpg' },
            caption: caption,
            mentions: [senderId]
        }, { quoted: m });
    } catch (err) {
        console.log('Image send failed, sending text only:', err.message);
        await sock.sendMessage(chatId, { text: caption, mentions: [senderId] }, { quoted: m });
    }
    // React baada ya kutuma
    await sock.sendMessage(chatId, { react: { text: '📂', key: m.key } });
};

module.exports = handler;