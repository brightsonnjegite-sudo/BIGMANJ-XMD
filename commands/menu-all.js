const moment = require('moment-timezone');

const getMentionNumber = (jid) => jid.split('@')[0];
const getGreeting = () => {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
};

const CATEGORIES = {
    '📂 GENERAL': ['.help', '.ping', '.alive', '.owner', '.repo', '.stats', '.settings', '.checkupdates', '.jid'],
    '👥 GROUP': ['.add', '.kick', '.promote', '.demote', '.tagall', '.tagnotadmin', '.hidetag', '.tag', '.mention', '.setmention', '.setgname', '.setgdesc', '.setgpp', '.staff', '.listonline', '.clear', '.resetlink'],
    '🛡️ SECURITY': ['.antilink', '.antitag', '.antibot', '.antimention', '.antimentionstatus', '.antidelete', '.antibadword', '.anticall', '.pmblocker', '.ban', '.unban', '.warn', '.warnings', '.checkadmin', '.checkadmins'],
    '🤖 AI': ['.gpt', '.aivoice', '.imagine', '.translate', '.bigmanj', '.ghost', '.getcode', '.getlink'],
    '📥 DOWNLOAD': ['.play', '.video', '.music', '.facebook', '.instagram', '.igs', '.igsc', '.tiktok', '.gdrive', '.ytmp3', '.ytmp4', '.shazam', '.lyrics'],
    '🎨 EFFECTS': ['.metallic', '.ice', '.snow', '.impressive', '.matrix', '.light', '.neon', '.devil', '.purple', '.thunder', '.leaves', '.1917', '.arena', '.hacker', '.sand', '.blackpink', '.glitch', '.fire', '.wasted', '.mickey', '.blur', '.take', '.steal', '.crop', '.toimg'],
    '👑 OWNER': ['.sudo', '.update', '.checkupdates', '.newgroup', '.mode', '.clearsession', '.cleartmp', '.setpp', '.pp', '.autostatus', '.autotyping', '.autoread', '.areact'],
    '⚙️ SETTINGS': ['.autoread', '.autotyping', '.autostatus', '.areact', '.setmention', '.groupmention', '.mention', '.antidelete', '.pmblocker', '.anticall', '.settings'],
    '🔧 TOOLS': ['.toimg', '.autourl', '.audiourl', '.url', '.tourl', '.getcode', '.getlink', '.qr', '.emojimix', '.emix', '.stickertelegram', '.tg', '.tgsticker', '.telesticker', '.viewonce', '.vv', '.sticker', '.s', '.stickeralt', '.gpstatus', '.tts', '.delete', '.del', '.report', '.weather', '.halotel', '.topmembers', '.character', '.stats', '.repo'],
    '🎮 FUN': ['.truth', '.dare', '.joke', '.compliment', '.lyrics', '.character', '.weather', '.report', '.wasted', '.mickey', '.ship', '.mylove', '.mylve'],
    '⚡ AUTOMATION': ['.autostatus', '.autoread', '.autotyping', '.areact', '.antibot', '.antimention', '.antimentionstatus', '.antilink', '.antitag', '.chatbot', '.bigmanj']
};

function addLetterPrefix(cmds) {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    return cmds.map((cmd, idx) => `${letters[idx % letters.length]}) ${cmd}`);
}

const handler = async (sock, chatId, m) => {
    const senderId = m.key.participant || m.key.remoteJid;
    const greeting = getGreeting();
    const mention = getMentionNumber(senderId);

    let caption = `✨ ${greeting} @${mention}\n\n📋 *ALL COMMANDS BY CATEGORY (A-Z)*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [category, cmds] of Object.entries(CATEGORIES)) {
        caption += `*${category}*\n`;
        const listed = addLetterPrefix(cmds);
        for (const item of listed) caption += `└➤ ${item}\n`;
        caption += `\n`;
    }
    caption += `🚀 *BIGMANj MD* — Fast • Powerful • Reliable\n\n> bigmanj tech™`;

    await sock.sendMessage(chatId, { text: caption, mentions: [senderId] }, { quoted: m });
    await sock.sendMessage(chatId, { react: { text: '📋', key: m.key } });
};

module.exports = handler;