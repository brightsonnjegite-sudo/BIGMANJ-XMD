async function checkAdminsCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups.' }, { quoted: message });
            return;
        }

        // Fetch group metadata (bot only needs to be a member, not admin)
        const groupMetadata = await sock.groupMetadata(chatId);
        const admins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');

        if (admins.length === 0) {
            await sock.sendMessage(chatId, { text: '👥 No admins found in this group.' }, { quoted: message });
            return;
        }

        let adminList = '👑 *GROUP ADMINS* 👑\n\n';
        const mentions = [];

        admins.forEach((admin, index) => {
            const jid = admin.id;
            const name = jid.split('@')[0];
            const role = admin.admin === 'superadmin' ? '🌟 SUPER ADMIN' : '🔹 ADMIN';
            adminList += `${index + 1}. @${name} (${role})\n`;
            mentions.push(jid);
        });

        adminList += `\n📌 Total: ${admins.length} admin(s)`;
        adminList += `\n\n> BIGMANj tech`;

        // Send message with actual mentions (tags)
        await sock.sendMessage(chatId, {
            text: adminList,
            mentions: mentions
        }, { quoted: message });

    } catch (err) {
        console.error('Error in checkadmins command:', err);
        await sock.sendMessage(chatId, { text: '❌ Failed to retrieve admin list. Make sure the bot is a member of the group.' }, { quoted: message });
    }
}

module.exports = checkAdminsCommand;