const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

const menuCommand = async (sock, chatId, m) => {
    try {
        moment.tz.setDefault('Africa/Dar_es_Salaam');
        const now = moment();
        const hour = now.hour();
        let greeting;
        if (hour >= 5 && hour < 12) greeting = 'Habari za Asubuhi ☀️';
        else if (hour >= 12 && hour < 18) greeting = 'Habari za Mchana 🌤️';
        else greeting = 'Habari za Jioni 🌙';

        const userName = m.pushName || 'User';
        const senderId = m.key.participant || m.key.remoteJid;
        const ownerNumber = '255777580820';
        const ownerName = 'BIGMANj';

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

        const imageUrl = 'https://i.ibb.co/cX8ysKLT/RD32363337313436343437363340732e77686174736170702e6e6574-554891.jpg';

        // ===================== MENU CAPTION =====================
        let caption = '';
        caption += '🩸━━━━━━━━━━━━━━━━━━🩸\n';
        caption += '     *BIGMANj BOT*\n';
        caption += '🩸━━━━━━━━━━━━━━━━━━🩸\n\n';
        caption += `👋 ${greeting} @${userName}\n\n`;
        caption += `👑 Owner      : ${ownerName}\n`;
        caption += `📞 Owner No   : ${ownerNumber}\n`;
        caption += `⚡ Commands   : Auto Count\n`;
        caption += `🚀 Runtime    : ${formatUptime(process.uptime())}\n`;
        caption += `📅 Date       : ${now.format('DD/MM/YYYY')}\n`;
        caption += `⏰ Time       : ${now.format('HH:mm:ss')}\n\n`;
        caption += '🩸 FEAR THE CRASHER 🩸\n';
        caption += '> bigmanj tech™\n\n';
        caption += '━━━━━━━━━━━━━━━━━━━━━━\n';
        caption += '*📋 COMMAND LIST*\n';
        caption += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

        // --- General Commands (no descriptions) ---
        caption += '*🔹 GENERAL*\n';
        const general = ['.help', '.ping', '.alive', '.owner', '.repo', '.stats', '.settings', '.checkupdates', '.gpt', '.aivoice', '.imagine', '.sudo', '.update', '.newgroup', '.gdrive', '.getcode', '.getlink', '.compliment', '.lyrics', '.character', '.wasted', '.mickey', '.weather', '.report', '.halotel', '.waste', '.autostatus', '.autotyping', '.autoread', '.areact'];
        for (const cmd of general) caption += `• ${cmd}\n`;
        caption += '\n';

        caption += '*🔹 GROUP & MODERATION*\n';
        const group = ['.add', '.kick', '.promote', '.demote', '.tagall', '.tagnotadmin', '.hidetag', '.tag', '.mention', '.setmention', '.setgname', '.setgdesc', '.setgpp', '.ban', '.unban', '.antibadword', '.antilink', '.antitag', '.pmblocker', '.anticall', '.resetlink', '.staff', '.antimention', '.antimentionstatus', '.antibot', '.listonline', '.toimg'];
        for (const cmd of group) caption += `• ${cmd}\n`;
        caption += '\n';

        caption += '*🔹 MEDIA & DOWNLOAD*\n';
        const media = ['.sticker', '.stickeralt', '.stickertelegram', '.setpp', '.pp', '.img-blur', '.facebook', '.instagram', '.igs', '.igsc', '.tiktok', '.shazam', '.play', '.video', '.music', '.url'];
        for (const cmd of media) caption += `• ${cmd}\n`;
        caption += '\n';

        caption += '*🔹 EFFECTS & TEXTMAKER*\n';
        const effects = ['.metallic', '.ice', '.snow', '.impressive', '.matrix', '.light', '.neon', '.devil', '.purple', '.thunder', '.leaves', '.1917', '.arena', '.hacker', '.sand', '.blackpink', '.glitch', '.fire'];
        for (const cmd of effects) caption += `• ${cmd}\n`;
        caption += '\n';
        caption += '> bigmanj tech™';

        // ===================== SEND MENU =====================
        await sock.sendMessage(chatId, {
            image: { url: imageUrl },
            caption: caption,
            mentions: [senderId]
        }, { quoted: m });

        // ===================== SEND AUDIO (Holy Drill) =====================
        // Ikiwa hutaki audio, zima kwa kuweka alama za maelezo kwenye block hii
        const audioPath = path.join(__dirname, '../assets/holy-drill-yeshua.mp3');
        setTimeout(async () => {
            try {
                if (fs.existsSync(audioPath)) {
                    const audioBuffer = fs.readFileSync(audioPath);
                    await sock.sendMessage(chatId, {
                        audio: audioBuffer,
                        mimetype: 'audio/mp4',
                        ptt: true
                    }, { quoted: m });
                } else {
                    // Tuma maandishi badala ya audio ikiwa faili halipo
                    await sock.sendMessage(chatId, {
                        text: '🎵 *Holy Drill - Yeshua*\n(Wimbo unapatikana CeeNaija au YouTube)'
                    }, { quoted: m });
                }
            } catch (err) {
                console.error('Audio error:', err.message);
            }
        }, 2500);

    } catch (e) {
        console.error('Menu error:', e);
        await sock.sendMessage(chatId, { text: '❌ Kuna hitilafu. Jaribu tena.' }, { quoted: m });
    }
};

module.exports = menuCommand;