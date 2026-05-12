const { setAntiBot, getAntiBot, removeAntiBot, addBotToAntiBot, removeBotFromAntiBot } = require('../lib/index');
const fs = require('fs');
const path = require('path');

async function handleAntiBotCommand(sock, chatId, message, match) {
    if (!match) {
        const config = await getAntiBot(chatId, 'on');
        const botsList = config && config.bots ? config.bots.map(jid => jid.split('@')[0]).join(', ') : 'None';
        return sock.sendMessage(chatId, {
            text: `*ANTIBOT SETUP*\n\n*.antibot on*\nTurn on antibot\n\n*.antibot off*\nDisables antibot in this group\n\n*.antibot add <number>*\nAdd a bot number to delete from\n\n*.antibot remove <number>*\nRemove a bot number\n\n*.antibot list*\nShow current bot list\n\nCurrent bots: ${botsList}`
        }, { quoted: message });
    }

    if (match === 'on') {
        const existingConfig = await getAntiBot(chatId, 'on');
        if (existingConfig?.enabled) {
            return sock.sendMessage(chatId, { text: '*AntiBot is already enabled for this group*' });
        }
        await setAntiBot(chatId, 'on', 'delete');
        return sock.sendMessage(chatId, { text: '*AntiBot has been enabled. Messages from listed bots will be deleted.*' }, { quoted: message });
    }

    if (match === 'off') {
        const config = await getAntiBot(chatId, 'on');
        if (!config?.enabled) {
            return sock.sendMessage(chatId, { text: '*AntiBot is already disabled for this group*' }, { quoted: message } );
        }
        await removeAntiBot(chatId);
        return sock.sendMessage(chatId, { text: '*AntiBot has been disabled for this group*' }, { quoted: message } );
    }

    if (match.startsWith('add ')) {
        const number = match.slice(4).trim();
        if (!number || !/^\d+$/.test(number)) {
            return sock.sendMessage(chatId, { text: '*Please provide a valid number, e.g., .antibot add 1234567890*' }, { quoted: message });
        }
        const botJid = number + '@s.whatsapp.net';
        await addBotToAntiBot(chatId, botJid);
        return sock.sendMessage(chatId, { text: `*Bot ${number} added to antibot list*` }, { quoted: message });
    }

    if (match.startsWith('remove ')) {
        const number = match.slice(7).trim();
        if (!number || !/^\d+$/.test(number)) {
            return sock.sendMessage(chatId, { text: '*Please provide a valid number, e.g., .antibot remove 1234567890*' }, { quoted: message });
        }
        const botJid = number + '@s.whatsapp.net';
        await removeBotFromAntiBot(chatId, botJid);
        return sock.sendMessage(chatId, { text: `*Bot ${number} removed from antibot list*` }, { quoted: message });
    }

    if (match === 'list') {
        const config = await getAntiBot(chatId, 'on');
        const botsList = config && config.bots ? config.bots.map(jid => jid.split('@')[0]).join(', ') : 'None';
        return sock.sendMessage(chatId, { text: `*AntiBot Bot List:*\n${botsList}` }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '*Invalid command. Use .antibot to see usage*' }, { quoted: message } );
}

async function handleBotDetection(sock, chatId, message, userMessage, senderId) {
    // Skip if not group
    if (!chatId.endsWith('@g.us')) return;

    // Skip if message is from bot
    if (message.key.fromMe) return;

    // Get antibot config first
    const antiBotConfig = await getAntiBot(chatId, 'on');
    if (!antiBotConfig?.enabled) {
        console.log('Antibot not enabled for this group');
        return;
    }

    // Check if sender is in the bots list
    if (antiBotConfig.bots && antiBotConfig.bots.includes(senderId)) {
        try {
            // Delete the message
            await sock.sendMessage(chatId, {
                delete: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: message.key.id,
                    participant: senderId
                }
            });
            console.log(`Deleted message from bot ${senderId} in ${chatId}`);
        } catch (error) {
            console.error('Error deleting bot message:', error);
        }
    }
}

module.exports = {
    handleAntiBotCommand,
    handleBotDetection
};