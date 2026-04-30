/**
 * play.js - MIKI MUSIC (YTDL-CORE VERSION)
 * Using local ytdl-core instead of external API for better reliability
 */

const yts = require('yt-search');
const ytdl = require('ytdl-core');
const YTDownloader = require('../lib/ytdl2');
const fs = require('fs');
const path = require('path');

async function playCommand(sock, chatId, message, args) {
    const query = Array.isArray(args) ? args.join(' ') : args;
    if (!query) return;

    await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } }).catch(() => {});

    try {
        const search = await yts(query);
        const v = search?.videos?.[0];
        if (!v) return sock.sendMessage(chatId, { text: '❌ *Sikuipata!*' }, { quoted: message });

        // Tuma Thumbnail
        await sock.sendMessage(chatId, {
            image: { url: video.thumbnail },
            caption: `🎵 *Title:* ${video.title}\n👤 *Author:* ${video.author.name}`
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } }).catch(() => {});

        // Get audio stream URL using ytdl-core
        const videoInfo = await ytdl.getInfo(video.url);
        const audioFormat = ytdl.chooseFormat(videoInfo.formats, { 
            quality: 'highestaudio',
            filter: 'audioonly' 
        });

        if (!audioFormat || !audioFormat.url) {
            throw new Error("Failed to get audio stream URL");
        }

        // TUMA WHATSAPP
        await sock.sendMessage(chatId, {
            audio: { url: audioFormat.url },
            mimetype: 'audio/mpeg',
            fileName: `${video.title}.mp3`
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } }).catch(() => {});

    } catch (err) {
        console.error("DEBUG ERROR:", err.message);
        await sock.sendMessage(chatId, {
            text: `❌ *Audio Error!*\n\n_Sababu: ${err.message}_`
        }, { quoted: message });
    }
}

module.exports = playCommand;
