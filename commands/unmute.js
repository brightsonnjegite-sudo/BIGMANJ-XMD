async function unmuteCommand(sock, chatId) {
    await sock.groupSettingUpdate(chatId, 'not_announcement'); // Unmute the group
    const responseText = `✅ The group has been unmuted.\n\n© bigmanj tech ™ with ♥︎`;
    await sock.sendMessage(chatId, { text: responseText });
}

module.exports = unmuteCommand;