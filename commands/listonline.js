const FOOTER = '\n\n> bigmanj tech';

async function listonlineCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye group pekee.' }, { quoted: message });
            return;
        }

        // Ensure global.onlineUsers exists
        if (!global.onlineUsers) {
            global.onlineUsers = new Map();
        }

        const senderId = message.key.participant || message.key.remoteJid;
        let groupUsers = global.onlineUsers.get(chatId);
        if (!groupUsers) {
            groupUsers = new Map();
            global.onlineUsers.set(chatId, groupUsers);
        }

        // 1. Mark the command sender as online (with current time)
        groupUsers.set(senderId, Date.now());

        // 2. Also add the bot’s own JID (if it’s a participant)
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        groupUsers.set(botJid, Date.now());

        // Remove any users who haven't been active in the last 10 minutes
        const now = Date.now();
        const TIMEOUT = 10 * 60 * 1000; // 10 minutes
        for (const [jid, lastSeen] of groupUsers.entries()) {
            if (now - lastSeen > TIMEOUT) {
                groupUsers.delete(jid);
            }
        }

        if (groupUsers.size === 0) {
            await sock.sendMessage(chatId, { text: '❌ Hakuna members walioonekana online kwa sasa.' }, { quoted: message });
            return;
        }

        // Fetch group metadata to get participant names
        const groupMetadata = await sock.groupMetadata(chatId);
        const participantMap = new Map();
        for (const p of groupMetadata.participants) {
            participantMap.set(p.id, p);
        }

        let listMessage = '📡 *ONLINE MEMBERS*\n\n';
        const mentions = [];

        for (const [jid, lastSeen] of groupUsers.entries()) {
            // Only include current participants
            const participant = participantMap.get(jid);
            if (!participant) continue;
            const name = participant.pushName || jid.split('@')[0];
            listMessage += `• @${name}\n`;
            mentions.push(jid);
        }

        if (mentions.length === 0) {
            await sock.sendMessage(chatId, { text: '❌ Hakuna members walioonekana online kwa sasa.' }, { quoted: message });
            return;
        }

        listMessage += `\n👥 Total Online: ${mentions.length}`;
        listMessage += FOOTER;

        await sock.sendMessage(chatId, {
            text: listMessage,
            mentions: mentions
        }, { quoted: message });

    } catch (error) {
        console.error('Error in .listonline:', error);
        await sock.sendMessage(chatId, { text: '❌ Imeshindwa kuorodhesha members online. Jaribu tena.' }, { quoted: message });
    }
}

module.exports = listonlineCommand;