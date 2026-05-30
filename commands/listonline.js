const FOOTER = '\n\n> bigmanj tech';

// Store last message timestamp per user (persist in memory)
if (!global.lastMessageTime) global.lastMessageTime = new Map(); // Map<chatId, Map<userJid, timestamp>>

async function listonlineCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye group pekee.' }, { quoted: message });
            return;
        }

        // 1. Update last message time for the sender
        const senderId = message.key.participant || message.key.remoteJid;
        if (!global.lastMessageTime.has(chatId)) {
            global.lastMessageTime.set(chatId, new Map());
        }
        const chatMsgMap = global.lastMessageTime.get(chatId);
        chatMsgMap.set(senderId, Date.now());

        // 2. Also update from presence updates if available (via global.onlineUsers)
        if (!global.onlineUsers) global.onlineUsers = new Map();
        let presenceMap = global.onlineUsers.get(chatId);
        if (!presenceMap) {
            presenceMap = new Map();
            global.onlineUsers.set(chatId, presenceMap);
        }

        // 3. Consider users "active" if they have sent a message in last 30 minutes OR presence shows online
        const now = Date.now();
        const MESSAGE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        const PRESENCE_TIMEOUT = 5 * 60 * 1000;  // 5 minutes for presence

        const activeUsers = new Map(); // jid -> lastActiveTimestamp

        // Add from message activity
        for (const [jid, lastMsg] of chatMsgMap.entries()) {
            if (now - lastMsg <= MESSAGE_TIMEOUT) {
                activeUsers.set(jid, lastMsg);
            }
        }

        // Add from presence updates
        for (const [jid, lastSeen] of presenceMap.entries()) {
            if (now - lastSeen <= PRESENCE_TIMEOUT) {
                // If already in activeUsers, keep the most recent timestamp
                const existing = activeUsers.get(jid);
                if (!existing || lastSeen > existing) {
                    activeUsers.set(jid, lastSeen);
                }
            }
        }

        // Always add the bot itself (so it shows up)
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        activeUsers.set(botJid, now);

        // Also add the command sender (again, ensure it's there)
        activeUsers.set(senderId, now);

        if (activeUsers.size === 0) {
            await sock.sendMessage(chatId, { text: '❌ Hakuna members waliotumwa ujumbe hivi karibuni au walioonekana online.' }, { quoted: message });
            return;
        }

        // Get group metadata for names
        const groupMetadata = await sock.groupMetadata(chatId);
        const participantMap = new Map();
        for (const p of groupMetadata.participants) {
            participantMap.set(p.id, p);
        }

        let listMessage = '📡 *RECENTLY ACTIVE MEMBERS*\n(Waliochapua ujumbe au kuonekana online)\n\n';
        const mentions = [];

        // Sort by most recent first (optional)
        const sorted = [...activeUsers.entries()].sort((a, b) => b[1] - a[1]);

        for (const [jid, lastActive] of sorted) {
            const participant = participantMap.get(jid);
            if (!participant) continue; // user no longer in group
            const name = participant.pushName || jid.split('@')[0];
            listMessage += `• @${name}\n`;
            mentions.push(jid);
        }

        listMessage += `\n👥 Total Active: ${mentions.length}`;
        listMessage += FOOTER;

        await sock.sendMessage(chatId, {
            text: listMessage,
            mentions: mentions
        }, { quoted: message });

    } catch (error) {
        console.error('Error in .listonline:', error);
        await sock.sendMessage(chatId, { text: '❌ Imeshindwa kuorodhesha members. Jaribu tena.' }, { quoted: message });
    }
}

module.exports = listonlineCommand;