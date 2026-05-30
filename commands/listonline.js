const FOOTER = '\n\n> bigmanj tech';

async function listonlineCommand(sock, chatId, message) {
    try {
        // 1. Ensure we are in a group
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye group pekee.' }, { quoted: message });
            return;
        }

        // 2. Ensure global.onlineUsers exists (if not, create it)
        if (!global.onlineUsers) {
            global.onlineUsers = new Map();
        }

        // 3. Mark the sender as online right now
        const senderId = message.key.participant || message.key.remoteJid;
        if (senderId) {
            let groupUsers = global.onlineUsers.get(chatId);
            if (!groupUsers) {
                groupUsers = new Map();
                global.onlineUsers.set(chatId, groupUsers);
            }
            groupUsers.set(senderId, Date.now());
        }

        const groupUsers = global.onlineUsers.get(chatId);
        if (!groupUsers || groupUsers.size === 0) {
            await sock.sendMessage(chatId, { text: '❌ Hakuna members walioonekana online kwa sasa.' }, { quoted: message });
            return;
        }

        // 4. Fetch group metadata (bot must be a member)
        let groupMetadata;
        try {
            groupMetadata = await sock.groupMetadata(chatId);
        } catch (err) {
            console.error('Failed to fetch group metadata:', err);
            await sock.sendMessage(chatId, { text: '❌ Bot sio member wa group hili au imeshindwa kupata taarifa za group.' }, { quoted: message });
            return;
        }

        const participantMap = new Map();
        for (const p of groupMetadata.participants) {
            participantMap.set(p.id, p);
        }

        let listMessage = '📡 *ONLINE MEMBERS*\n\n';
        const mentions = [];

        for (const [jid, lastSeen] of groupUsers.entries()) {
            // Skip if the user is no longer a participant (left the group)
            const participant = participantMap.get(jid);
            if (!participant) continue;
            // Use pushName if available, otherwise use the number part
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