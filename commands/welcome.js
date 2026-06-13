// commands/welcome.js
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys'); // for future use if needed

/**
 * Get group profile picture (returns buffer or null)
 */
async function getGroupProfilePicture(sock, groupJid) {
    try {
        const ppUrl = await sock.profilePictureUrl(groupJid, 'image');
        const response = await fetch(ppUrl);
        if (response.ok) {
            return Buffer.from(await response.arrayBuffer());
        }
    } catch (err) {
        console.log('No group profile picture or error:', err.message);
    }
    return null;
}

/**
 * Format group description (limit length)
 */
function formatDescription(desc) {
    if (!desc) return 'No description set.';
    if (desc.length > 200) return desc.slice(0, 200) + '...';
    return desc;
}

/**
 * Get greeting based on time
 */
function getGreeting() {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
}

/**
 * Main welcome handler – to be called from group-participants.update event
 */
async function handleGroupWelcome(sock, update) {
    try {
        const { id: groupJid, participants, action, author } = update;
        if (action !== 'add') return; // only care when members are added

        // Get group metadata
        const groupMetadata = await sock.groupMetadata(groupJid);
        const groupName = groupMetadata.subject || 'Group';
        const groupDesc = groupMetadata.desc || '';
        const memberCount = groupMetadata.participants.length;
        
        // Get group profile picture
        const groupPicBuffer = await getGroupProfilePicture(sock, groupJid);

        // Prepare basic info
        const greeting = getGreeting();
        const formattedDesc = formatDescription(groupDesc);
        
        // Send welcome message for each new participant
        for (const participant of participants) {
            const participantJid = participant;
            const participantNumber = participantJid.split('@')[0];
            
            // Build caption (text part)
            const caption = `${greeting} @${participantNumber}\n\n` +
                `👋 *KARIBU ${groupName}*\n\n` +
                `📋 *Group description:*\n${formattedDesc}\n\n` +
                `👥 *Total members:* ${memberCount}\n\n` +
                `🔰 Please read group rules and enjoy.\n\n` +
                `© bigmanj tech ™ with ♥︎`;
            
            // Send with image (group profile picture) if available, otherwise text only
            if (groupPicBuffer) {
                await sock.sendMessage(groupJid, {
                    image: groupPicBuffer,
                    caption: caption,
                    mentions: [participantJid]
                });
            } else {
                // If no profile picture, send plain text with border
                const fallbackMsg = `╭━━〔 *🎉 WELCOME ${groupName}* 〕━━⬣\n` +
                    `┃ ${greeting} @${participantNumber}\n` +
                    `┃\n` +
                    `┃ 📋 *Description:* ${formattedDesc}\n` +
                    `┃ 👥 *Members:* ${memberCount}\n` +
                    `┃\n` +
                    `┃ 🔰 Karibu sana!\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━━⬣\n\n` +
                    `© bigmanj tech ™ with ♥︎`;
                await sock.sendMessage(groupJid, {
                    text: fallbackMsg,
                    mentions: [participantJid]
                });
            }
        }
    } catch (err) {
        console.error('Welcome handler error:', err);
    }
}

module.exports = { handleGroupWelcome };