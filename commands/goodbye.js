// commands/goodbye.js
const moment = require('moment-timezone');

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
        // No profile picture – ignore
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
 * Get sad time‑based greeting
 */
function getSadGreeting() {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌧️ Asubuhi ya kusikitisha';
    if (hour >= 12 && hour < 18) return '☁️ Mchana wa huzuni';
    return '🌙 Usiku wa machozi';
}

/**
 * Main goodbye handler – to be called from group-participants.update event
 * Detects if user left voluntarily or was kicked by an admin.
 */
async function handleGroupGoodbye(sock, update) {
    try {
        const { id: groupJid, participants, action, author } = update;
        if (action !== 'remove') return; // only care when members are removed

        // Get group metadata (before removal? But participants list is already updated)
        // We'll fetch fresh metadata to get current member count after removal
        const groupMetadata = await sock.groupMetadata(groupJid);
        const groupName = groupMetadata.subject || 'Group';
        const groupDesc = groupMetadata.desc || '';
        const memberCount = groupMetadata.participants.length; // after removal

        const formattedDesc = formatDescription(groupDesc);
        const sadGreeting = getSadGreeting();

        // Get group profile picture (optional)
        const groupPicBuffer = await getGroupProfilePicture(sock, groupJid);

        // Send goodbye message for each leaving participant
        for (const participant of participants) {
            const participantJid = participant;
            const participantNumber = participantJid.split('@')[0];
            const authorNumber = author ? author.split('@')[0] : null;

            // Determine if kicked or self‑leave
            const isKicked = author && author !== participantJid;
            let reasonText = '';
            let extraEmoji = '';

            if (isKicked) {
                reasonText = `🚫 *Imefutwa na admin:* @${authorNumber}`;
                extraEmoji = '⚡😔';
            } else {
                reasonText = `🍃 *Ameondoka kwa hiari yake*`;
                extraEmoji = '💔🥀';
            }

            // Build sad caption
            const caption = `${sadGreeting} @${participantNumber}\n\n` +
                `${extraEmoji} *TUTAKUKUMBUKA ${groupName}* ${extraEmoji}\n\n` +
                `📋 *Group description:*\n${formattedDesc}\n\n` +
                `👥 *Members remaining:* ${memberCount}\n\n` +
                `${reasonText}\n\n` +
                `🍃 Kwaheri rafiki. Tuta miss uwepo wako.\n\n` +
                `© bigmanj tech ™ with ♥︎`;

            if (groupPicBuffer) {
                // Send image + caption
                await sock.sendMessage(groupJid, {
                    image: groupPicBuffer,
                    caption: caption,
                    mentions: [participantJid, author].filter(Boolean)
                });
            } else {
                // Fallback text box
                const fallbackMsg = `╭━━〔 *💔 GOODBYE ${groupName}* 〕━━⬣\n` +
                    `┃ ${sadGreeting} @${participantNumber}\n` +
                    `┃\n` +
                    `┃ 📋 *Description:* ${formattedDesc}\n` +
                    `┃ 👥 *Members left:* ${memberCount}\n` +
                    `┃\n` +
                    `┃ ${reasonText}\n` +
                    `┃\n` +
                    `┃ 🥀 Tuta miss uwepo wako.\n` +
                    `┃ 🍃 Kwaheri rafiki.\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━━━⬣\n\n` +
                    `© bigmanj tech ™ with ♥︎`;
                await sock.sendMessage(groupJid, {
                    text: fallbackMsg,
                    mentions: [participantJid, author].filter(Boolean)
                });
            }
        }
    } catch (err) {
        console.error('Goodbye handler error:', err);
    }
}

module.exports = { handleGroupGoodbye };