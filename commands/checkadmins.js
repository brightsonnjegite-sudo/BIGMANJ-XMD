async function checkAdminCommand(sock, chatId, message) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        let botJid = sock.user.id;
        if (!botJid.includes('@s.whatsapp.net')) {
            const botNumber = botJid.split(':')[0];
            botJid = `${botNumber}@s.whatsapp.net`;
        }

        const botParticipant = groupMetadata.participants.find(p => p.id === botJid);
        const isBotAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
        
        let reply = `🔍 *Bot Info*\nJID: ${botJid}\n`;
        reply += `Admin: ${isBotAdmin ? '✅ YES' : '❌ NO'}\n`;
        reply += `\n📋 *Participants list (first 5)*:\n`;
        groupMetadata.participants.slice(0, 5).forEach(p => {
            reply += `- ${p.id} (${p.admin || 'member'})\n`;
        });
        
        await sock.sendMessage(chatId, { text: reply }, { quoted: message });
    } catch (err) {
        await sock.sendMessage(chatId, { text: '❌ Error: ' + err.message }, { quoted: message });
    }
}

module.exports = checkAdminCommand;