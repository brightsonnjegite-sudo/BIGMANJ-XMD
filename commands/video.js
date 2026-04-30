/**
 * video.js - MIKI VIDEO (YTDL-CORE VERSION)
 * Using local ytdl-core instead of external API for better reliability
 */

const yts = require('yt-search');const ytdl = require('ytdl-core');const { YTDownloader } = require('../lib/ytdl2');
const axios = require('axios');

async function videoCommand(sock, chatId, message, args) {
    const query = Array.isArray(args) ? args.join(' ') : args;

    if (!query) {
        return sock.sendMessage(chatId, {
            text: '╭━━━━〔 *MICKEY VIDEO* 〕━━━━┈⊷\n┃ 📝 `.video [jina la video]`\n╰━━━━━━━━━━━━━━━━━━━━┈⊷'
        }, { quoted: message });
    }

    // Reaction (itikia)
    await sock.sendMessage(chatId, {
        react: { text: '🎬', key: message.key }
    }).catch(() => {});

    try {
        // 1. YouTube Search
        const search = await yts(query);
        const v = search?.videos?.[0];

        if (!v) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return sock.sendMessage(chatId, { text: '❌ *Sikuipata!*' }, { quoted: message });
        }

        // 2. Info ya Video
        await sock.sendMessage(chatId, {
            image: { url: v.thumbnail },
            caption: `╭━━━━〔 *VIDEO DOWNLOADING* 〕━━━━┈⊷\n┃ 🎬 *Title:* ${v.title}\n┃ ⏳ *Duration:* ${v.timestamp}\n┃ 👁️ *Views:* ${v.views}\n╰━━━━━━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } }).catch(() => {});

        // Get video stream URL using ytdl-core
        const videoInfo = await ytdl.getInfo(v.url);
        const videoFormat = ytdl.chooseFormat(videoInfo.formats, { 
            quality: 134, // 360p
            filter: 'videoandaudio' 
        });

        if (!videoFormat || !videoFormat.url) {
            throw new Error("Failed to get video stream URL");
        }

        // Tuma Video kwny WhatsApp
        await sock.sendMessage(chatId, {
            video: { url: videoFormat.url },
            mimetype: 'video/mp4',
            caption: `✅ *${v.title}*\n\nEnjoy your video!`,
            fileName: `${v.title}.mp4`
        }, { quoted: message });

        // Success Reaction
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        }).catch(() => {});

    } catch (err) {
        console.error("❌ VIDEO ERROR:", err.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }).catch(() => {});

        await sock.sendMessage(chatId, {
            text: `❌ *Video Error!*\n\n_Sababu: ${err.message}_`
        }, { quoted: message });
    }
}

module.exports = videoCommand;
