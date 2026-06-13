// commands/welcome.js
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const welcomeSettingsFile = path.join(process.cwd(), 'data', 'welcome_settings.json');

function isWelcomeEnabled(groupJid) {
    if (!fs.existsSync(welcomeSettingsFile)) return true;
    try {
        const data = JSON.parse(fs.readFileSync(welcomeSettingsFile));
        return data[groupJid] !== false;
    } catch {
        return true;
    }
}

async function getGroupProfilePicture(sock, groupJid) {
    try {
        const ppUrl = await sock.profilePictureUrl(groupJid, 'image');
        const response = await fetch(ppUrl);
        if (response.ok) return Buffer.from(await response.arrayBuffer());
    } catch (err) {}
    return null;
}

function getGreeting() {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
}

async function handleGroupWelcome(sock, update) {
    try {
        const { id: groupJid, participants, action } = update;
        if (action !== 'add') return;
        if (!isWelcomeEnabled(groupJid)) return;

        const groupMetadata = await sock.groupMetadata(groupJid);
        const groupName = groupMetadata.subject || 'Group';
        const groupDesc = groupMetadata.desc || '';
        const memberCount = groupMetadata.participants.length;
        const groupPic = await getGroupProfilePicture(sock, groupJid);
        const greeting = getGreeting();

        for (const participant of participants) {
            const participantNumber = participant.split('@')[0];
            const caption = `${greeting} @${participantNumber}\n\n` +
                `👋 *KARIBU ${groupName}*\n\n` +
                `📋 *Group description:*\n${groupDesc.slice(0, 200)}${groupDesc.length > 200 ? '...' : ''}\n\n` +
                `👥 *Total members:* ${memberCount}\n\n` +
                `🔰 Please read group rules and enjoy.\n\n` +
                `© bigmanj tech ™ with ♥︎`;
            if (groupPic) {
                await sock.sendMessage(groupJid, { image: groupPic, caption, mentions: [participant] });
            } else {
                const fallback = `╭━━〔 *🎉 WELCOME ${groupName}* 〕━━⬣\n┃ ${greeting} @${participantNumber}\n┃\n┃ 📋 *Description:* ${groupDesc.slice(0, 150)}...\n┃ 👥 *Members:* ${memberCount}\n┃\n┃ 🔰 Karibu sana!\n╰━━━━━━━━━━━━━━━━━━━━━━⬣\n\n© bigmanj tech ™ with ♥︎`;
                await sock.sendMessage(groupJid, { text: fallback, mentions: [participant] });
            }
        }
    } catch (err) {
        console.error('Welcome error:', err);
    }
}

module.exports = { handleGroupWelcome };