const { sendGiftedButtons } = require('gifted-btns');
const axios = require('axios');
const yts = require('yt-search');

async function playCommand(sock, chatId, message, args) {
    try {
        const q = Array.isArray(args) ? args.join(' ') : args;
        if (!q) return sock.sendMessage(chatId, { text: 'Unataka wimbo gani?' });

        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        const s = await yts(q);
        const v = s?.videos?.[0];
        if (!v) return sock.sendMessage(chatId, { text: '❌ Sikuipata!' });

        const buttons = [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "🎵 AUDIO (MP4)",
                    id: `.myaudio ${v.url}`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "🎥 VIDEO (MP4)",
                    id: `.myvideo ${v.url}`
                })
            }
        ];

        await sendGiftedButtons({
            sock: sock,
            chatId: chatId,
            body: `🎬 *Title:* ${v.title}\n⏲️ *Dur:* ${v.timestamp}\n👤 *Author:* ${v.author.name}`,
            footer: "Mickey Glitch Labs",
            title: "PLAY MENU",
            media: { image: { url: v.thumbnail } },
            buttons: buttons,
            quoted: message
        });

    } catch (err) {
        console.error(err);
        sock.sendMessage(chatId, { text: 'Error: ' + err.message });
    }
}

// HAPA NDIPO MUHIMU: Inabidi u-export hivi kama pingCommand
module.exports = playCommand;
