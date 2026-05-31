const settings = require('../settings');

/**
 * .mylve – My Love command (owner only)
 * Returns a fixed romantic message.
 */
async function mylveCommand(sock, chatId, message) {
    try {
        // 1. Get sender's JID
        const senderId = message.key.participant || message.key.remoteJid;

        // 2. Get owner's JID from settings.js
        let ownerJid = null;
        if (settings.ownerNumber) {
            let clean = settings.ownerNumber.toString().replace(/\s/g, '');
            if (!clean.includes('@')) clean = `${clean}@s.whatsapp.net`;
            ownerJid = clean;
        }

        // 3. Check if sender is the bot owner
        const isOwner = senderId === ownerJid;

        if (!isOwner) {
            await sock.sendMessage(chatId, {
                text: '❌ This command is for the bot owner only.'
            }, { quoted: message });
            return;
        }

        // 4. Fixed response (change "DAT PERSON" and "ndigwa" as you like)
        const loveMessage = `❤️ Your Love Is (*DAT PERSON* {ndigwa}) ❤️\n\n> bigamnj`;

        await sock.sendMessage(chatId, { text: loveMessage }, { quoted: message });

    } catch (error) {
        console.error('Error in .mylve:', error);
        await sock.sendMessage(chatId, {
            text: '❌ An error occurred. Please try again later.'
        }, { quoted: message });
    }
}

module.exports = mylveCommand;