const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const DATA_PATH = path.join(__dirname, '../data/antibot.json');
const FOOTER = '\n\n> bigmanj tech';

function loadData() {
    try {
        if (!fs.existsSync(DATA_PATH)) return { groups: {}, botJids: [] };
        return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    } catch {
        return { groups: {}, botJids: [] };
    }
}

function saveData(data) {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// Helper: check if a user is group admin
async function isGroupAdmin(sock, chatId, jid) {
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participant = metadata.participants.find(p => p.id === jid);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch {
        return false;
    }
}

// Helper: get bot owner JID
function getOwnerJid() {
    if (!settings.ownerNumber) return null;
    let clean = settings.ownerNumber.toString().replace(/\s/g, '');
    if (!clean.includes('@')) clean = `${clean}@s.whatsapp.net`;
    return clean;
}

// Helper: check if a JID is a known bot
function isKnownBot(jid, botJids) {
    return botJids.includes(jid);
}

// Helper: check if the message is likely from a bot (name heuristic or known list)
function isLikelyBot(senderName, senderJid, botJids) {
    if (isKnownBot(senderJid, botJids)) return true;
    // Heuristic: name contains "bot" (case‑insensitive)
    if (senderName && /bot/i.test(senderName)) return true;
    return false;
}

// Perform action based on mode
async function executeAction(sock, chatId, senderId, message, action) {
    // Delete the message
    try {
        await sock.sendMessage(chatId, { delete: message.key });
    } catch (err) {
        console.error('Failed to delete bot message:', err);
    }

    const warningMsg = `⚠️ *Anti‑Bot*\nBot nyingine haziruhusiwi kwenye group hili. Hatua: ${action.toUpperCase()}.` + FOOTER;

    if (action === 'delete only') {
        // no extra warning
    } else if (action === 'delete warn') {
        await sock.sendMessage(chatId, { text: warningMsg });
    } else if (action === 'delete warn kick') {
        await sock.sendMessage(chatId, { text: warningMsg });
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = await isGroupAdmin(sock, chatId, botJid);
        if (isBotAdmin) {
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, { text: `🔨 Bot imefukuzwa kwenye group.` + FOOTER });
            } catch (err) {
                console.error('Kick failed:', err);
                await sock.sendMessage(chatId, { text: `❌ Kushindwa kufukuza bot. Hakikisha bot ni admin.` });
            }
        } else {
            await sock.sendMessage(chatId, { text: `❌ Bot sio admin – haiwezi kufukuza. Badilisha mode kuwa delete warn au delete only.` });
        }
    }
}

// Main command handler: .antibot on/off/set/add/remove
async function antibotCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye group pekee.' + FOOTER, quoted: message });
        return;
    }

    // Only owner/sudo can change settings
    const isOwnerOrSudo = require('../lib/isOwner');
    const isAuthorized = await isOwnerOrSudo(senderId, sock, chatId);
    if (!isAuthorized && !message.key.fromMe) {
        await sock.sendMessage(chatId, { text: '❌ Owner au sudo pekee ndiye anaweza kutumia .antibot.' + FOOTER, quoted: message });
        return;
    }

    const data = loadData();
    if (!data.groups[chatId]) data.groups[chatId] = { enabled: false, action: 'delete warn' };
    const sub = (args[0] || '').toLowerCase();

    // .antibot on
    if (sub === 'on') {
        data.groups[chatId].enabled = true;
        saveData(data);
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑Bot IMEWASHWA* – Mode: ${data.groups[chatId].action}. Ujumbe wa bot nyingine utafutwa.` + FOOTER, quoted: message });
    }
    // .antibot off
    else if (sub === 'off') {
        data.groups[chatId].enabled = false;
        saveData(data);
        await sock.sendMessage(chatId, { text: `🔓 *Anti‑Bot IMEZIMWA*` + FOOTER, quoted: message });
    }
    // .antibot set <mode>
    else if (sub === 'set') {
        const mode = (args[1] || '').toLowerCase();
        let action;
        if (mode === 'deletewarnkick' || mode === 'delete warn kick') action = 'delete warn kick';
        else if (mode === 'deletewarn' || mode === 'delete warn') action = 'delete warn';
        else if (mode === 'deleteonly' || mode === 'delete only') action = 'delete only';
        else {
            await sock.sendMessage(chatId, { text: `❌ Mode isiyo sahihi. Tumia: deletewarnkick, deletewarn, deleteonly` + FOOTER, quoted: message });
            return;
        }
        data.groups[chatId].action = action;
        saveData(data);
        await sock.sendMessage(chatId, { text: `✅ Mode imebadilishwa kuwa: *${action}*` + FOOTER, quoted: message });
    }
    // .antibot add <number@domain>  (add a bot JID to the global list)
    else if (sub === 'add') {
        const botJid = (args[1] || '').trim();
        if (!botJid || !botJid.includes('@')) {
            await sock.sendMessage(chatId, { text: `❌ Tafadhali toa JID kamili ya bot, kwa mfano: .antibot add 255712345678@s.whatsapp.net` + FOOTER, quoted: message });
            return;
        }
        if (!data.botJids) data.botJids = [];
        if (!data.botJids.includes(botJid)) {
            data.botJids.push(botJid);
            saveData(data);
            await sock.sendMessage(chatId, { text: `✅ Bot imeongezwa kwenye orodha ya kuzuia: ${botJid}` + FOOTER, quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: `ℹ️ Bot tayari ipo kwenye orodha.` + FOOTER, quoted: message });
        }
    }
    // .antibot remove <number@domain>
    else if (sub === 'remove') {
        const botJid = (args[1] || '').trim();
        if (!botJid) {
            await sock.sendMessage(chatId, { text: `❌ Tafadhali toa JID ya bot kuondoa.` + FOOTER, quoted: message });
            return;
        }
        if (data.botJids && data.botJids.includes(botJid)) {
            data.botJids = data.botJids.filter(j => j !== botJid);
            saveData(data);
            await sock.sendMessage(chatId, { text: `✅ Bot imeondolewa kwenye orodha: ${botJid}` + FOOTER, quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: `ℹ️ Bot haikupatikana kwenye orodha.` + FOOTER, quoted: message });
        }
    }
    // .antibot list  (show all registered bot JIDs)
    else if (sub === 'list') {
        const bots = data.botJids || [];
        if (bots.length === 0) {
            await sock.sendMessage(chatId, { text: `📭 Hakuna bot zilizoongezwa kwenye orodha.` + FOOTER, quoted: message });
        } else {
            let list = `🤖 *Bot Orodha*\n\n`;
            bots.forEach((j, i) => { list += `${i+1}. ${j}\n`; });
            list += FOOTER;
            await sock.sendMessage(chatId, { text: list, quoted: message });
        }
    }
    // Show status
    else {
        const status = data.groups[chatId].enabled ? 'IMEWASHWA' : 'IMEZIMWA';
        const mode = data.groups[chatId].action;
        const botCount = (data.botJids || []).length;
        await sock.sendMessage(chatId, { text: `🛡️ *Anti‑Bot*\nHali: ${status}\nMode: ${mode}\nBot JIDs zilizosajiliwa: ${botCount}\n\nMatumizi:\n.antibot on/off\n.antibot set <deletewarnkick|deletewarn|deleteonly>\n.antibot add <jid>\n.antibot remove <jid>\n.antibot list` + FOOTER, quoted: message });
    }
}

// Function to check incoming messages (called from main.js)
async function handleAntiBotCheck(sock, chatId, message) {
    // Skip if not a group
    if (!chatId.endsWith('@g.us')) return;

    const data = loadData();
    if (!data.groups[chatId] || !data.groups[chatId].enabled) return;

    const senderId = message.key.participant || message.key.remoteJid;

    // Exceptions: bot itself, bot owner, group admins
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    if (senderId === botJid) return; // itself

    const ownerJid = getOwnerJid();
    if (ownerJid && senderId === ownerJid) return;

    const isAdmin = await isGroupAdmin(sock, chatId, senderId);
    if (isAdmin) return;

    // Check if the sender is a known bot (from list) or appears to be a bot (heuristic)
    const senderName = message.pushName || '';
    const isBot = isLikelyBot(senderName, senderId, data.botJids || []);
    if (!isBot) return;

    // This is a bot – perform the configured action
    const action = data.groups[chatId].action;
    await executeAction(sock, chatId, senderId, message, action);
}

module.exports = { antibotCommand, handleAntiBotCheck };