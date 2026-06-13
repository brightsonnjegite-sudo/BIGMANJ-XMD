// commands/goodbye.js
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const goodbyeSettingsFile = path.join(process.cwd(), 'data', 'goodbye_settings.json');

function isGoodbyeEnabled(groupJid) {
    if (!fs.existsSync(goodbyeSettingsFile)) return true;
    try {
        const data = JSON.parse(fs.readFileSync(goodbyeSettingsFile));
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

function getSadGreeting() {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌧️ Asubuhi ya kusikitisha';
    if (hour >= 12 && hour < 18) return '☁️ Mchana wa huzuni';
    return '🌙 Usiku wa machozi';
}

async function handleGroupGoodbye(sock, update) {
    try {
        const { id: groupJid, participants, action, author } = update;
        if (action !== 'remove') return;
        if (!isGoodbyeEnabled(groupJid)) return;

        const groupMetadata = await sock.groupMetadata(groupJid);
        const groupName = groupMetadata.subject || 'Group';
        const groupDesc = groupMetadata.desc || '';
        const memberCount = groupMetadata.participants.length;
        const groupPic = await getGroupProfilePicture(sock, groupJid);
        const sadGreeting = getSadGreeting();

        for (const participant of participants) {
            const participantNumber = participant.split('@')[0];
            const isKicked = author && author !== participant;
            const reasonText = isKicked ? `🚫 *Imefutwa na admin:* @${author.split('@')[0]}` : `🍃 *Ameondoka kwa hiari yake*`;
            const extraEmoji = isKicked ? '⚡😔' : '💔🥀';
            const caption = `${sadGreeting} @${participantNumber}\n\n` +
                `${extraEmoji} *TUTAKUKUMBUKA ${groupName}* ${extraEmoji}\n\n` +
                `📋 *Group description:*\n${groupDesc.slice(0, 200)}${groupDesc.length > 200 ? '...' : ''}\n\n` +
                `👥 *Members remaining:* ${memberCount}\n\n` +
                `${reasonText}\n\n` +
                `🍃 Kwaheri rafiki. Tuta miss uwepo wako.\n\n` +
                `© bigmanj tech ™ with ♥︎`;
            const mentions = [participant];
            if (author && author !== participant) mentions.push(author);
            if (groupPic) {
                await sock.sendMessage(groupJid, { image: groupPic, caption, mentions });
            } else {
                const fallback = `╭━━〔 *💔 GOODBYE ${groupName}* 〕━━⬣\n┃ ${sadGreeting} @${participantNumber}\n┃\n┃ 📋 *Description:* ${groupDesc.slice(0, 150)}...\n┃ 👥 *Members left:* ${memberCount}\n┃\n┃ ${reasonText}\n┃\n┃ 🥀 Tuta miss uwepo wako.\n┃ 🍃 Kwaheri rafiki.\n╰━━━━━━━━━━━━━━━━━━━━━━⬣\n\n© bigmanj tech ™ with ♥︎`;
                await sock.sendMessage(groupJid, { text: fallback, mentions });
            }
        }
    } catch (err) {
        console.error('Goodbye error:', err);
    }
}

module.exports = { handleGroupGoodbye };