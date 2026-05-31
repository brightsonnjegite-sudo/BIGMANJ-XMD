const moment = require('moment-timezone');

/**
 * @project: BIGMANJ BOT
 * @description: Menu with dog image and full command list in the caption
 */

const menuCommand = async (sock, chatId, m) => {
    try {
        // Set timezone to Tanzania
        moment.tz.setDefault('Africa/Dar_es_Salaam');
        const now = moment();
        const hour = now.hour();
        let greeting;
        if (hour >= 5 && hour < 12) greeting = 'Habari za Asubuhi ☀️';
        else if (hour >= 12 && hour < 18) greeting = 'Habari za Mchana 🌤️';
        else greeting = 'Habari za Jioni 🌙';

        const userName = m.pushName || 'User';
        const senderId = m.key.participant || m.key.remoteJid;

        function formatUptime(seconds) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            if (days > 0) return `${days}d ${hours}h ${minutes}m`;
            if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
            if (minutes > 0) return `${minutes}m ${secs}s`;
            return `${secs}s`;
        }

        // Image URL (your dog image)
        const imageUrl = 'https://i.ibb.co/cX8ysKLT/RD32363337313436343437363340732e77686174736170702e6e6574-554891.jpg';

        // ---------- Build full caption with command list ----------
        let caption = 
            `🩸━━━━━━━━━━━━━━━━━━🩸
      BIGMANJ BOT
🩸━━━━━━━━━━━━━━━━━━🩸

👋 ${greeting} @${userName}

👑 Owner      : BIGMANJ
⚡ Commands   : Auto Count
🚀 Runtime    : ${formatUptime(process.uptime())}
📅 Date       : ${now.format('DD/MM/YYYY')}
⏰ Time       : ${now.format('HH:mm:ss')}

🩸 FEAR THE CRASHER 🩸
> bigmanj tech™

━━━━━━━━━━━━━━━━━━━━━━
📋 *COMMAND LIST*
━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Categories and commands
        const categories = [
            {
                name: '🔹 GENERAL',
                commands: ['.help', '.ping', '.alive', '.owner', '.repo', '.stats', '.settings', '.checkupdates']
            },
            {
                name: '🔹 GROUP',
                commands: ['.add', '.kick', '.promote', '.demote', '.tagall', '.tagnotadmin', '.hidetag', '.tag', '.mention', '.setmention', '.setgname', '.setgdesc', '.setgpp']
            },
            {
                name: '🔹 MODERATION',
                commands: ['.ban', '.unban', '.antibadword', '.antilink', '.antitag', '.pmblocker', '.anticall', '.resetlink', '.staff']
            },
            {
                name: '🔹 MEDIA',
                commands: ['.sticker', '.stickeralt', '.stickertelegram', '.setpp', '.pp', '.img-blur', '.facebook', '.instagram', '.igs', '.igsc', '.tiktok', '.shazam']
            },
            {
                name: '🔹 AUDIO / VIDEO',
                commands: ['.play', '.video', '.music', '.url']
            },
            {
                name: '🔹 FUN',
                commands: ['.compliment', '.lyrics', '.character', '.wasted', '.mickey', '.weather', '.report', '.halotel', '.waste']
            },
            {
                name: '🔹 AUTOMATION',
                commands: ['.autostatus', '.autotyping', '.autoread', '.areact']
            },
            {
                name: '🔹 AI / BOT',
                commands: ['.gpt', '.aivoice', '.imagine', '.sudo', '.update', '.newgroup', '.gdrive', '.getcode', '.getlink']
            },
            {
                name: '🔹 EFFECTS',
                commands: ['.metallic', '.ice', '.snow', '.impressive', '.matrix', '.light', '.neon', '.devil', '.purple', '.thunder', '.leaves', '.1917', '.arena', '.hacker', '.sand', '.blackpink', '.glitch', '.fire']
            }
        ];

        for (const cat of categories) {
            caption += `${cat.name}\n`;
            caption += cat.commands.map(cmd => `   ${cmd}`).join(' · ') + '\n\n';
        }

        caption += `> bigmanj tech™`;

        // Send image with full caption (including command list) and mention
        await sock.sendMessage(chatId, {
            image: { url: imageUrl },
            caption: caption,
            mentions: [senderId]
        }, { quoted: m });

    } catch (e) {
        console.error('Menu Error:', e);
        await sock.sendMessage(chatId, {
            text: '❌ Kuna hitilafu. Jaribu tena.'
        }, { quoted: m });
    }
};

module.exports = menuCommand;