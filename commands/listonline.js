const FOOTER = '\n\n> bigmanj tech';

async function listonlineCommand(sock, chatId, message) {
    try {
        // Only works in groups
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: '❌ Command hii inafanya kazi kwenye group pekee.'
            }, { quoted: message });
            return;
        }

        // Access global online users map (must be maintained by main.js)
        if (!global.onlineUsers) {
            global.onlineUsers = new Map();
        }
        const onlineJids = global.onlineUsers.get(chatId) || new Set();

        if (onlineJids.size === 0) {
            await sock.sendMessage(chatId, {
                text: '❌ Hakuna members walioonekana online kwa sasa.'
            }, { quoted: message });
            return;
        }

        // Fetch group metadata to get participant names
        const groupMetadata = await sock.groupMetadata(chatId);
        const participantMap = new Map();
        for (const p of groupMetadata.participants) {
            participantMap.set(p.id, p);
        }

        // Build list of online members with mentions
        let listMessage = '📡 *ONLINE MEMBERS*\n\n';
        const mentions = [];

        for (const jid of onlineJids) {
            const participant = participantMap.get(jid);
            if (!participant) continue; // maybe left group
            const name = participant.pushName || participant.id.split('@')[0];
            listMessage += `• @${name}\n`;
            mentions.push(jid);
        }

        listMessage += `\n👥 Total Online: ${mentions.length}`;
        listMessage += FOOTER;

        await sock.sendMessage(chatId, {
            text: listMessage,
            mentions: mentions
        }, { quoted: message });

    } catch (error) {
        console.error('Error in .listonline:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Imeshindwa kuorodhesha members online. Jaribu tena.'
        }, { quoted: message });
    }
}

module.exports = listonlineCommand;