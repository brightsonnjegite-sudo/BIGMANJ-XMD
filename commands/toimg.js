const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const TEMP_DIR = path.join(__dirname, '../temp');

// Ensure temp directory exists
async function ensureTempDir() {
    try {
        await fs.access(TEMP_DIR);
    } catch {
        await fs.mkdir(TEMP_DIR, { recursive: true });
    }
}

async function toimgCommand(sock, chatId, message) {
    try {
        await ensureTempDir();

        // Check if replying to a message
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) {
            await sock.sendMessage(chatId, {
                text: '❌ Reply sticker kwanza kisha tumia .toimg'
            }, { quoted: message });
            return;
        }

        // Check if the replied message is a sticker
        const stickerMsg = quotedMsg.stickerMessage;
        if (!stickerMsg) {
            await sock.sendMessage(chatId, {
                text: '❌ Hii si sticker. Tafadhali reply sticker .webp.'
            }, { quoted: message });
            return;
        }

        // Download sticker
        const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const stickerBuffer = Buffer.concat(chunks);

        if (!stickerBuffer || stickerBuffer.length === 0) {
            throw new Error('Sticker buffer is empty');
        }

        // Convert .webp to .png using sharp
        const pngBuffer = await sharp(stickerBuffer).png().toBuffer();

        // ✅ Updated caption with footer "bigmanj tech"
        const caption = `*BIGMANJ*\n\nbigmanj tech`;

        // Send the image
        await sock.sendMessage(chatId, {
            image: pngBuffer,
            caption: caption
        }, { quoted: message });

    } catch (error) {
        console.error('Error in toimg command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Imeshindwa kubadilisha sticker. Hakikisha sticker ni valid na jaribu tena.'
        }, { quoted: message });
    }
}

module.exports = toimgCommand;