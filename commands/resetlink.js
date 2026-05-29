async function resetlinkCommand(sock, chatId, senderId) {
    try {
        // 🔄 Force fresh group metadata (avoid cache)
        const groupMetadata = await sock.groupMetadata(chatId);
        
        // 🆔 Get correct bot ID
        let botJid = sock.user.id;
        // Ensure it ends with @s.whatsapp.net
        if (!botJid.includes('@s.whatsapp.net')) {
            const botNumber = botJid.split(':')[0];
            botJid = `${botNumber}@s.whatsapp.net`;
        }

        // ✅ Check if sender is admin
        const isAdmin = groupMetadata.participants.some(p => 
            p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin')
        );

        // ✅ Check if bot is admin
        const isBotAdmin = groupMetadata.participants.some(p => 
            p.id === botJid && (p.admin === 'admin' || p.admin === 'superadmin')
        );

        // 🔍 Debugging (remove in production if not needed)
        console.log(`[ResetLink] Sender: ${senderId}, isAdmin: ${isAdmin}`);
        console.log(`[ResetLink] Bot JID: ${botJid}, isBotAdmin: ${isBotAdmin}`);
        console.log(`[ResetLink] Participants:`, groupMetadata.participants.map(p => ({ id: p.id, admin: p.admin })));

        if (!isAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Only admins can use this command!' });
            return;
        }

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Bot must be admin to reset group link!' });
            return;
        }

        // 🔁 Revoke current invite link
        const newCode = await sock.groupRevokeInvite(chatId);
        
        // 📤 Send new link
        await sock.sendMessage(chatId, { 
            text: `✅ Group link has been successfully reset\n\n📌 New link:\nhttps://chat.whatsapp.com/${newCode}`
        });

    } catch (error) {
        console.error('❌ Error in resetlink command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to reset group link! Make sure the bot has admin privileges.' });
    }
}

module.exports = resetlinkCommand;