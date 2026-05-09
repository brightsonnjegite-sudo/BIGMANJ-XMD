const axios = require('axios');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

/**
 * Get profile picture command - Enhanced with WhiskeySockets Baileys
 * @param {Object} sock - Baileys socket instance
 * @param {Object} m - Message object
 * @param {Array} args - Command arguments
 */
const getProfilePictureCommand = async (sock, m, args) => {
    try {
        // Validate message object
        if (!m || !m.key || !m.key.remoteJid) {
            console.error("Error: Invalid message object");
            return;
        }

        const chatId = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        // Determine target user
        let target = sender; // Default to sender

        // Check for mentions in the message
        const mentionedJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentionedJids && mentionedJids.length > 0) {
            target = mentionedJids[0];
        }

        // Check for quoted message (reply to someone)
        const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;
        if (quotedParticipant) {
            target = quotedParticipant;
        }

        // Check for phone number in args
        if (args && args.length > 0 && args[0]) {
            const phoneNumber = args[0].replace(/[^0-9]/g, '');
            if (phoneNumber) {
                target = phoneNumber + '@s.whatsapp.net';
            }
        }

        // Validate target format
        if (!target || !target.includes('@s.whatsapp.net')) {
            return await sock.sendMessage(chatId, {
                text: '❌ *Invalid target!*\n\nUsage: `.getpp` (your own)\n`.getpp @mention`\n`.getpp 255xxxxxxxxx`'
            }, { quoted: m });
        }

        // Attempt to get profile picture URL
        let profileUrl;
        try {
            profileUrl = await sock.profilePictureUrl(target, 'image');
        } catch (error) {
            console.error('Profile picture fetch error:', error);
            return await sock.sendMessage(chatId, {
                text: `❌ *Profile picture not available*\n\nThe user may have privacy settings enabled or no profile picture set.`
            }, { quoted: m });
        }

        // Download the image using axios with proper headers
        const response = await axios.get(profileUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 30000 // 30 second timeout
        });

        // Validate response
        if (!response.data || response.data.length === 0) {
            return await sock.sendMessage(chatId, {
                text: '❌ *Failed to download profile picture*'
            }, { quoted: m });
        }

        // Get target info for caption
        const targetNumber = target.split('@')[0];
        const isOwn = target === sender;

        // Send the profile picture
        await sock.sendMessage(chatId, {
            image: Buffer.from(response.data),
            caption: `✅ *Profile Picture ${isOwn ? '(Yours)' : ''}*\n\n👤 *User:* @${targetNumber}\n📏 *Size:* ${(response.data.length / 1024).toFixed(2)} KB`,
            mentions: [target]
        }, { quoted: m });

    } catch (error) {
        console.error('GetPP Command Error:', error);

        // Send error message
        try {
            await sock.sendMessage(m.key.remoteJid, {
                text: `❌ *Error occurred while fetching profile picture*\n\n${error.message || 'Unknown error'}`
            }, { quoted: m });
        } catch (sendError) {
            console.error('Failed to send error message:', sendError);
        }
    }
};

module.exports = getProfilePictureCommand;
module.exports.name = 'getpp';
module.exports.category = 'UTILITY';
module.exports.description = 'Get profile picture of yourself or mentioned user';
