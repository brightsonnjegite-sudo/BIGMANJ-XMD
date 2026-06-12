const moment = require('moment-timezone');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------- Baileys imports ----------
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

// ---------- Helper functions ----------
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

// ---------- Image & audio URLs ----------
const MENU_IMAGES = [
    'https://files.catbox.moe/rt3wya.jpg',
    'https://files.catbox.moe/69csjf.jpg',
    'https://files.catbox.moe/wz28nv.jpg',
    'https://files.catbox.moe/07brl4.jpg',
    'https://files.catbox.moe/uii8bi.jpg',
    'https://files.catbox.moe/dhl8dp.jpg',
    'https://files.catbox.moe/n6adzs.jpg',
    'https://files.catbox.moe/gom02i.jpg'
];
const AUDIO_URL = 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3';

let currentImageIndex = 0;
let cachedAudio = null;

async function getRandomImageBuffer() {
    const url = MENU_IMAGES[currentImageIndex % MENU_IMAGES.length];
    currentImageIndex++;
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
        const resized = await sharp(res.data)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();
        return resized;
    } catch (err) {
        console.error('Image error:', err.message);
        return null;
    }
}

async function getAudioBuffer() {
    if (cachedAudio) return cachedAudio;
    try {
        const res = await axios.get(AUDIO_URL, { responseType: 'arraybuffer', timeout: 30000 });
        cachedAudio = Buffer.from(res.data);
        console.log('✅ Audio loaded');
        return cachedAudio;
    } catch (err) {
        console.error('Audio error:', err.message);
        return null;
    }
}

// ---------- Premium Button V3 ----------
async function sendButtonV3(sock, chatId, options) {
    const { title, subtitle, body, footer, buttons, thumbnailBuffer, quotedMsg } = options;

    const buttonRows = buttons.map(btn => ({
        buttonId: btn.id,
        buttonText: { displayText: btn.text },
        type: 1
    }));

    const msg = generateWAMessageFromContent(chatId, {
        buttonsMessage: {
            contentText: body,
            footerText: footer,
            headerType: 6,
            locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: title,
                address: subtitle,
                jpegThumbnail: thumbnailBuffer
            },
            viewOnce: true,
            contextInfo: {
                quotedMessage: quotedMsg?.message,
                participant: quotedMsg?.key?.participant,
                remoteJid: quotedMsg?.key?.remoteJid,
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363419090044864@newsletter",
                    newsletterName: "BIGMANJ BOT V3"
                },
                externalAdReply: {
                    title: "⚡ BIGMANJ BOT V3 ⚡",
                    body: "© bigmanj tech ™ with ♥︎",
                    thumbnailUrl: "https://files.catbox.moe/uii8bi.jpg",
                    sourceUrl: "https://whatsapp.com/channel/0029Vb6B9xFCxoAseuG1g610",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            },
            buttons: buttonRows
        }
    }, { userJid: sock.user.id });

    await sock.relayMessage(chatId, msg.message, { messageId: msg.key.id });
}

// ---------- Main menu handler ----------
const menuHandler = async (sock, chatId, m) => {
    const text = getMessageText(m).trim().toLowerCase();
    if (text !== '.menu') return;

    const senderId = m.key.participant || m.key.remoteJid;
    const pushname = m.pushName || "User";
    const isOwner = (senderId.split('@')[0] === "255777580820");
    const status = isOwner ? "👑 OWNER" : "🤖 USER";
    const start = Date.now();
    await sock.sendMessage(chatId, { react: { text: '📌', key: m.key } });
    const ping = Date.now() - start;

    // System stats
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = Math.round((usedMem / totalMem) * 100);
    const ramBar = "█".repeat(Math.round(ramPercent / 10)) + "░".repeat(10 - Math.round(ramPercent / 10));
    const runtime = formatUptime(process.uptime());
    const version = "3.0.0";
    const totalCommands = 210;
    const library = "Baileys";
    const ownerName = "bigmanj tech";

    const greeting = getGreeting();
    const mention = getMentionNumber(senderId);
    const caption = `
╭━━〔 *⚡ BIGMANJ BOT V3 ⚡* 〕━━⬣
┃ ${greeting} @${mention}
┃ 👤 *User* : ${pushname}
┃ ⚡ *Status* : ${status}
┃ 🚀 *Ping* : ${ping}ms
┃ 💾 *RAM* : ${ramBar} ${ramPercent}%
┃ ⏱ *Runtime* : ${runtime}
┃ 🤖 *Bot Version* : ${version}
┃ 📚 *Commands* : ${totalCommands}
┃ 📡 *Library* : ${library}
┃ 👑 *Owner* : ${ownerName}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━⬣

🔐 *Russian Cyber Security Mode* – активен
✨ *Premium AI Assistant* – готов
🌑 *Dark Futuristic UI* – загружен

*Используйте кнопки ниже для навигации*
    `.trim();

    const thumbnail = await getRandomImageBuffer();
    if (!thumbnail) {
        await sock.sendMessage(chatId, { text: caption, mentions: [senderId] }, { quoted: m });
        const audioBuffer = await getAudioBuffer();
        if (audioBuffer) {
            await sock.sendMessage(chatId, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: 'menu_audio.mp3'
            }, { quoted: m });
        }
        return;
    }

    await sendButtonV3(sock, chatId, {
        title: "⚡ BIGMANJ BOT V3 ⚡",
        subtitle: "© bigmanj tech ™ with ♥︎",
        body: caption,
        footer: "╰━━━━━━━━━━━━━━━━━━━━━━━━━━⬣\n© BIGMANJ BOT V3 — by bigmanj tech ™",
        buttons: [
            { text: "📚 All Menu", id: ".menu-all" },
            { text: "👑 Owner Menu", id: ".menu-owner" }
        ],
        thumbnailBuffer: thumbnail,
        quotedMsg: m
    });

    const audioBuffer = await getAudioBuffer();
    if (audioBuffer) {
        await sock.sendMessage(chatId, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: 'menu_audio.mp3'
        }, { quoted: m });
    }
};

module.exports = menuHandler;