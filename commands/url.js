const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * Upload a file to catbox.moe using raw multipart/form-data (no external packages)
 * @param {string} filePath - local path to the file
 * @returns {Promise<string>} - direct URL (https://files.catbox.moe/...)
 */
async function uploadToCatbox(filePath) {
    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const boundary = '----CatboxBoundary' + Date.now();
    const CRLF = '\r\n';

    let formData = '';
    formData += '--' + boundary + CRLF;
    formData += 'Content-Disposition: form-data; name="reqtype"' + CRLF + CRLF;
    formData += 'fileupload' + CRLF;

    formData += '--' + boundary + CRLF;
    formData += `Content-Disposition: form-data; name="fileToUpload"; filename="${fileName}"` + CRLF;
    formData += 'Content-Type: application/octet-stream' + CRLF + CRLF;

    const headerBuffer = Buffer.from(formData, 'utf-8');
    const fileBuffer = fileData;
    const footerBuffer = Buffer.from(CRLF + '--' + boundary + '--' + CRLF, 'utf-8');

    const body = Buffer.concat([headerBuffer, fileBuffer, footerBuffer]);

    const response = await axios.post('https://catbox.moe/user/api.php', body, {
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length
        },
        timeout: 60000
    });

    const url = response.data.trim();
    if (!url.startsWith('https://files.catbox.moe/')) {
        throw new Error('Catbox returned invalid URL: ' + url);
    }
    return url;
}

async function getMediaBufferAndExt(message) {
    const m = message.message || {};
    if (m.imageMessage) {
        const stream = await downloadContentFromMessage(m.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.jpg' };
    }
    if (m.videoMessage) {
        const stream = await downloadContentFromMessage(m.videoMessage, 'video');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.mp4' };
    }
    if (m.audioMessage) {
        const stream = await downloadContentFromMessage(m.audioMessage, 'audio');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.mp3' };
    }
    if (m.documentMessage) {
        const stream = await downloadContentFromMessage(m.documentMessage, 'document');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const fileName = m.documentMessage.fileName || 'file.bin';
        const ext = path.extname(fileName) || '.bin';
        return { buffer: Buffer.concat(chunks), ext };
    }
    if (m.stickerMessage) {
        const stream = await downloadContentFromMessage(m.stickerMessage, 'sticker');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.webp' };
    }
    return null;
}

async function getQuotedMediaBufferAndExt(message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
    if (!quoted) return null;
    return getMediaBufferAndExt({ message: quoted });
}

async function urlCommand(sock, chatId, message) {
    try {
        let media = await getMediaBufferAndExt(message);
        if (!media) media = await getQuotedMediaBufferAndExt(message);

        if (!media) {
            await sock.sendMessage(chatId, { text: '❌ Send or reply to a media (image, video, audio, sticker, document) to get a Catbox URL.' }, { quoted: message });
            return;
        }

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const tempPath = path.join(tempDir, `${Date.now()}${media.ext}`);
        fs.writeFileSync(tempPath, media.buffer);

        let url = '';
        try {
            url = await uploadToCatbox(tempPath);
        } finally {
            setTimeout(() => {
                try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (e) {}
            }, 2000);
        }

        if (!url) {
            await sock.sendMessage(chatId, { text: '❌ Failed to upload media to Catbox.' }, { quoted: message });
            return;
        }

        // Added footer
        const responseText = `🔗 *Catbox URL:*\n${url}\n\n© bigmanj tech ™ with ♥︎`;
        await sock.sendMessage(chatId, { text: responseText }, { quoted: message });
    } catch (error) {
        console.error('[URL] error:', error?.message || error);
        await sock.sendMessage(chatId, { text: '❌ Failed to convert media to URL.' }, { quoted: message });
    }
}

module.exports = urlCommand;