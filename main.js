/**
 * MICKEY GLITCH- MAIN HANDLER
 * Complete with Welcome/Goodbye Toggle Commands & Event Handlers
 */

// 🧹 Fix for ENOSPC / temp overflow
const fs = require('fs');
const path = require('path');

const customTemp = path.join(process.cwd(), 'temp');
const customTmp = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
if (!fs.existsSync(customTmp)) fs.mkdirSync(customTmp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

setInterval(() => {
  [customTemp, customTmp].forEach(folder => {
    fs.readdir(folder, (err, files) => {
      if (err) return;
      files.forEach(file => {
        const filePath = path.join(folder, file);
        try { fs.rmSync(filePath, { recursive: true, force: true }); } catch(e) {}
      });
    });
  });
}, 2 * 60 * 1000);

const settings = require('./settings');
require('./config.js');

// ========== ALL IMPORTS (as in original working bot) ==========
const { isBanned } = require('./lib/isBanned');
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const { autotypingCommand, isAutotypingEnabled, handleAutotypingForMessage, handleAutotypingForCommand, showTypingAfterCommand } = require('./commands/autotyping');
const { autoreadCommand, isAutoreadEnabled, handleAutoread } = require('./commands/autoread');
const { autoBioCommand } = require('./commands/autobio');

const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/menu');
const banCommand = require('./commands/ban');
const addCommand = require('./commands/add');
const { promoteCommand } = require('./commands/promote');
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const gpstatusCommand = require('./commands/gpstatus');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const { handleAntilinkCommand, handleLinkDetection } = require('./commands/antilink');
const { handleAntitagCommand, handleTagDetection } = require('./commands/antitag');
const { Antilink } = require('./lib/antilink');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand, groupMentionToggleCommand } = require('./commands/mention');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
const weatherCommand = require('./commands/weather');
const reportCommand = require('./commands/report');
const halotelCommand = require('./commands/halotel');
const kickCommand = require('./commands/kick');
const { complimentCommand } = require('./commands/compliment');
const lyricsCommand = require('./commands/lyrics');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const blurCommand = require('./commands/img-blur');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./commands/antibadword');
const takeCommand = require('./commands/take');
const characterCommand = require('./commands/character');
const wastedCommand = require('./commands/wasted');
const resetlinkCommand = require('./commands/resetlink');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } = require('./commands/demote');
const viewOnceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/autostatus');
const stickerTelegramCommand = require('./commands/stickertelegram');
const textmakerCommand = require('./commands/textmaker');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete');
const clearTmpCommand = require('./commands/cleartmp');
const setProfilePicture = require('./commands/setpp');
const { setGroupDescription, setGroupName, setGroupPhoto } = require('./commands/groupmanage');
const instagramCommand = require('./commands/instagram');
const facebookCommand = require('./commands/facebook');
const playCommand = require('./commands/play');
const tiktokCommand = require('./commands/tiktok');
const aiCommand = require('./commands/ai');
const aiVoiceCommand = require('./commands/ai');
const { handleChatbotMessage, groupChatbotToggleCommand, bigmanjToggleCommand } = require('./commands/chatbot');
const urlCommand = require('./commands/url');
const { handleTranslateCommand } = require('./commands/translate');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
const imagineCommand = require('./commands/imagine');
const videoCommand = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const stickercropCommand = require('./commands/stickercrop');
const mickeyCommand = require('./commands/Mickey');
const { updateCommand } = require('./commands/update');
const checkUpdatesCommand = require('./commands/checkupdates');
const { igsCommand } = require('./commands/igs');
const { anticallCommand, readState: readAnticallState } = require('./commands/anticall');
const { pinCommand, verifyPinCommand, checkPinVerification } = require('./commands/pin');
const { pmblockerCommand, readState: readPmBlockerState } = require('./commands/pmblocker');
const settingsCommand = require('./commands/settings');
const newgroupCommand = require('./commands/newgroup');
const gdriveCommand = require('./commands/gdrive');
const getcodeCommand = require('./commands/getcode');
const getlinkCommand = require('./commands/getlink');
const shazamCommand = require('./commands/shazam');
const repoCommand = require('./commands/repo');
const statsCommand = require('./commands/stats');
const stickerAltCommand = require('./commands/sticker-alt');
const checkAdminCommand = require('./commands/checkadmin');
const checkAdminsCommand = require('./commands/checkadmins');
const { antimentionCommand, handleMentionCheck, isTextViolating } = require('./commands/antimention');
const { antimentionstatusCommand, handleStatusMentionCheck } = require('./commands/antimentionstatus');
const toimgCommand = require('./commands/toimg');
const listonlineCommand = require('./commands/listonline');
const { antibotCommand, handleAntiBotCheck } = require('./commands/antibot');
const mylveCommand = require('./commands/mylve');
const autourlCommand = require('./commands/autourl');

const menuGeneral = require('./commands/menu-general');
const menuGroup = require('./commands/menu-group');
const menuSecurity = require('./commands/menu-security');
const menuAi = require('./commands/menu-ai');
const menuDownload = require('./commands/menu-download');
const menuEffects = require('./commands/menu-effects');
const menuOwner = require('./commands/menu-owner');
const menuSettings = require('./commands/menu-settings');
const menuTools = require('./commands/menu-tools');
const menuFun = require('./commands/menu-fun');
const menuAutomation = require('./commands/menu-automation');
const menuAll = require('./commands/menu-all');

// ========== WELCOME / GOODBYE SETTINGS & HANDLERS (built-in) ==========
const moment = require('moment-timezone');

const welcomeSettingsFile = path.join(process.cwd(), 'data', 'welcome_settings.json');
const goodbyeSettingsFile = path.join(process.cwd(), 'data', 'goodbye_settings.json');

function loadWelcomeSettings() {
    if (!fs.existsSync(welcomeSettingsFile)) return {};
    try { return JSON.parse(fs.readFileSync(welcomeSettingsFile)); } catch { return {}; }
}
function saveWelcomeSettings(settings) {
    fs.writeFileSync(welcomeSettingsFile, JSON.stringify(settings, null, 2));
}
function loadGoodbyeSettings() {
    if (!fs.existsSync(goodbyeSettingsFile)) return {};
    try { return JSON.parse(fs.readFileSync(goodbyeSettingsFile)); } catch { return {}; }
}
function saveGoodbyeSettings(settings) {
    fs.writeFileSync(goodbyeSettingsFile, JSON.stringify(settings, null, 2));
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
function getSadGreeting() {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌧️ Asubuhi ya kusikitisha';
    if (hour >= 12 && hour < 18) return '☁️ Mchana wa huzuni';
    return '🌙 Usiku wa machozi';
}

async function handleGroupWelcome(sock, update) {
    try {
        const { id: groupJid, participants, action } = update;
        if (action !== 'add') return;
        const settings = loadWelcomeSettings();
        if (settings[groupJid] === false) return;

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
    } catch (err) { console.error('Welcome error:', err); }
}

async function handleGroupGoodbye(sock, update) {
    try {
        const { id: groupJid, participants, action, author } = update;
        if (action !== 'remove') return;
        const settings = loadGoodbyeSettings();
        if (settings[groupJid] === false) return;

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
    } catch (err) { console.error('Goodbye error:', err); }
}

async function toggleWelcomeCommand(sock, chatId, message, args) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye vikundi tu.' }, { quoted: message });
        return;
    }
    const settings = loadWelcomeSettings();
    const current = settings[chatId] !== false;
    const action = args[0]?.toLowerCase();
    if (action === 'on') {
        settings[chatId] = true;
        saveWelcomeSettings(settings);
        await sock.sendMessage(chatId, { text: '✅ Welcome messages *imewashwa* kwa kikundi hiki.\n© bigmanj tech ™ with ♥︎' }, { quoted: message });
    } else if (action === 'off') {
        settings[chatId] = false;
        saveWelcomeSettings(settings);
        await sock.sendMessage(chatId, { text: '❌ Welcome messages *imezimwa* kwa kikundi hiki.\n© bigmanj tech ™ with ♥︎' }, { quoted: message });
    } else {
        await sock.sendMessage(chatId, { text: `🔔 Welcome messages ni *${current ? 'imewashwa' : 'imezimwa'}*.\nTumia: .welcome on / .welcome off\n© bigmanj tech ™ with ♥︎` }, { quoted: message });
    }
}

async function toggleGoodbyeCommand(sock, chatId, message, args) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '❌ Command hii inafanya kazi kwenye vikundi tu.' }, { quoted: message });
        return;
    }
    const settings = loadGoodbyeSettings();
    const current = settings[chatId] !== false;
    const action = args[0]?.toLowerCase();
    if (action === 'on') {
        settings[chatId] = true;
        saveGoodbyeSettings(settings);
        await sock.sendMessage(chatId, { text: '✅ Goodbye messages *imewashwa* kwa kikundi hiki.\n© bigmanj tech ™ with ♥︎' }, { quoted: message });
    } else if (action === 'off') {
        settings[chatId] = false;
        saveGoodbyeSettings(settings);
        await sock.sendMessage(chatId, { text: '❌ Goodbye messages *imezimwa* kwa kikundi hiki.\n© bigmanj tech ™ with ♥︎' }, { quoted: message });
    } else {
        await sock.sendMessage(chatId, { text: `🔔 Goodbye messages ni *${current ? 'imewashwa' : 'imezimwa'}*.\nTumia: .goodbye on / .goodbye off\n© bigmanj tech ™ with ♥︎` }, { quoted: message });
    }
}

// ========== GLOBAL SETTINGS & ONLINE TRACKER ==========
global.packname = settings.packname;
global.author = settings.author;
global.channelLink = "https://whatsapp.com/channel/0029Vb6B9xFCxoAseuG1g610";
global.ytch = "MICKEY";
global.autostatusHandler = require(path.join(process.cwd(), 'commands', 'autostatus.js'));

global.onlineUsers = new Map();
const ONLINE_TIMEOUT = 5 * 60 * 1000;
setInterval(() => {
    const now = Date.now();
    for (const [groupJid, users] of global.onlineUsers.entries()) {
        for (const [userJid, lastSeen] of users.entries()) {
            if (now - lastSeen > ONLINE_TIMEOUT) users.delete(userJid);
        }
        if (users.size === 0) global.onlineUsers.delete(groupJid);
    }
}, 60 * 1000);

function initOnlineTracker(sock) {
    if (!sock) return;
    sock.ev.on('presence.update', (update) => {
        const { id, presences } = update;
        if (!id.endsWith('@g.us')) return;
        let groupUsers = global.onlineUsers.get(id);
        if (!groupUsers) {
            groupUsers = new Map();
            global.onlineUsers.set(id, groupUsers);
        }
        for (const [jid, presenceData] of Object.entries(presences)) {
            const status = presenceData.lastKnownPresence;
            if (status === 'available' || status === 'composing' || status === 'recording') {
                groupUsers.set(jid, Date.now());
            }
        }
    });
    console.log('✅ Online tracker initialised');
}

async function sendImageWithCopyButton(sock, chatId, imageUrl) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
        const imageBuffer = Buffer.from(response.data);
        const interactiveButtons = [{
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({ display_text: '📋 MENU', id: 'copy_menu_command', copy_code: '.menu' })
        }];
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: '🌟 *BIGMANJ BOT V3 IMPROVED* 🌟\n *and ready 🚀*\n\n© bigmanj tech ™ with ♥︎ 🤖',
            interactiveButtons
        });
        console.log('✅ Sent image with interactive copy button.');
    } catch (error) {
        console.error('Failed to send image with button.', error);
        const fallbackMsg = '______________________________\n🌟 *BIGMANJ BOT V3 IMPROVED* 🌟\n          *and ready 🚀*\n\n*© bigmanj tech ™ with ♥︎ 🤖*\n\n📋 Copy this command: `.menu`';
        await sock.sendMessage(chatId, { text: fallbackMsg });
    }
}

async function handlePostUpdateMessage(sock) {
    const flagFile = path.join(process.cwd(), 'data', 'update_just_done.flag');
    if (fs.existsSync(flagFile)) {
        try {
            const flagData = JSON.parse(fs.readFileSync(flagFile, 'utf8'));
            const chatId = flagData.chatId;
            if (chatId && sock) {
                await sendImageWithCopyButton(sock, chatId, 'https://files.catbox.moe/uii8bi.jpg');
            }
        } catch (err) {
            console.error('Failed to send post-update message:', err);
        } finally {
            fs.unlinkSync(flagFile);
        }
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;
        if (!id.endsWith('@g.us')) return;
        if (action === 'add') await handleGroupWelcome(sock, update);
        else if (action === 'remove') await handleGroupGoodbye(sock, update);
        let isPublic = true;
        try {
            const modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof modeData.isPublic === 'boolean') isPublic = modeData.isPublic;
        } catch(e) {}
        if (action === 'promote' && isPublic) await handlePromotionEvent(sock, id, participants, author);
        if (action === 'demote' && isPublic) await handleDemotionEvent(sock, id, participants, author);
    } catch(e) { console.error(e); }
}

async function handleStatus(sock, messageUpdate) {
    try {
        if (!sock || !messageUpdate?.messages) return;
        for (const m of messageUpdate.messages) {
            if (m.key?.remoteJid !== 'status@broadcast') continue;
            let statusText = '';
            if (m.message?.conversation) statusText = m.message.conversation;
            else if (m.message?.extendedTextMessage?.text) statusText = m.message.extendedTextMessage.text;
            else if (m.message?.imageMessage?.caption) statusText = m.message.imageMessage.caption;
            else if (m.message?.videoMessage?.caption) statusText = m.message.videoMessage.caption;
            if (!statusText) {
                try {
                    const str = JSON.stringify(m.message);
                    const match = str.match(/"text":"([^"]+)"/);
                    if (match) statusText = match[1];
                } catch(e) {}
            }
            const hasMention = /@/i.test(statusText);
            const isGroupMentionBox = /this group was mentioned/i.test(statusText);
            if (hasMention || isGroupMentionBox) {
                try { await sock.sendMessage('status@broadcast', { delete: m.key }); console.log('Deleted violating status'); } catch(e) {}
                continue;
            }
            if (global.autostatusHandler?.handleAutoStatus) {
                await global.autostatusHandler.handleAutoStatus(sock, { messages: [m] });
            }
        }
    } catch(e) { console.error(e); }
}

// ========== MESSAGE HANDLER WITH FULL SWITCH ==========
async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;
        const message = messages[0];
        if (!message?.message) return;

        await handleAutoread(sock, message);
        if (message.message) storeMessage(sock, message);
        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const senderIsSudo = await isSudo(senderId);
        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);

        if (isGroup) {
            await handleMentionCheck(sock, chatId, message);
            await handleStatusMentionCheck(sock, chatId, message);
            await handleAntiBotCheck(sock, chatId, message);
            if (senderId) {
                let groupUsers = global.onlineUsers.get(chatId);
                if (!groupUsers) {
                    groupUsers = new Map();
                    global.onlineUsers.set(chatId, groupUsers);
                }
                groupUsers.set(senderId, Date.now());
            }
        }

        let userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim();

        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        if (userMessage.startsWith('.')) console.log(`📝 Command: ${userMessage}`);

        const countFilePath = './data/messageCount.json';
        if (!fs.existsSync(countFilePath)) {
            fs.writeFileSync(countFilePath, JSON.stringify({ isPublic: true }, null, 2));
        }
        let isPublic = true;
        try {
            const data = JSON.parse(fs.readFileSync(countFilePath, 'utf8'));
            if (typeof data.isPublic === 'boolean') isPublic = data.isPublic;
        } catch (e) {}

        const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;
        if (isBanned(senderId) && !userMessage.startsWith('.unban')) {
            if (Math.random() < 0.1) await sock.sendMessage(chatId, { text: '❌ You are banned.' });
            return;
        }

        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

        if (isGroup) {
            if (userMessage) await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            await Antilink(message, sock);
        }

        if (!isGroup && !message.key.fromMe && !senderIsOwnerOrSudo) {
            const pmState = readPmBlockerState();
            if (pmState.enabled) {
                await sock.sendMessage(chatId, { text: pmState.message || 'PMs blocked.' });
                await new Promise(r => setTimeout(r, 1500));
                try { await sock.updateBlockStatus(chatId, 'block'); } catch(e) {}
                return;
            }
        }

        if (!userMessage.startsWith('.')) {
            const replyQuoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quotedText = (replyQuoted?.conversation || replyQuoted?.extendedTextMessage?.text || '').toString().toLowerCase();
            const isMenuReply = quotedText && (quotedText.includes('command categories') || quotedText.includes('reply with number'));
            if (isMenuReply && /^\d+$/.test(userMessage)) {
                await helpCommand(sock, chatId, message, `.help ${parseInt(userMessage)}`);
                return;
            }
            try {
                const firstToken = userMessage.split(' ')[0];
                const knownCommands = helpCommand.getAllCommands ? helpCommand.getAllCommands() : [];
                if (firstToken && knownCommands.includes(firstToken)) userMessage = '.' + userMessage;
            } catch(e) {}
            if (!userMessage.startsWith('.')) {
                await handleAutotypingForMessage(sock, chatId, userMessage);
                if (isGroup) {
                    await handleTagDetection(sock, chatId, message, senderId);
                    await handleMentionDetection(sock, chatId, message);
                }
                try { if (typeof handleChatbotMessage === 'function') await handleChatbotMessage(sock, chatId, message, userMessage); } catch(e) {}
                return;
            }
        }

        if (!isPublic && !isOwnerOrSudoCheck) return;

        const adminCommands = ['.mute','.unmute','.ban','.unban','.promote','.demote','.kick','.tagall','.tagnotadmin','.hidetag','.antilink','.antitag','.setgdesc','.setgname','.setgpp'];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));
        const ownerCommands = ['.mode','.autostatus','.antidelete','.cleartmp','.setpp','.pp','.clearsession','.areact','.autoreact','.autotyping','.autoread','.pmblocker'];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false, isBotAdmin = false;
        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;
            if (!isBotAdmin) { await sock.sendMessage(chatId, { text: 'Make bot admin first.' }); return; }
            if ((userMessage.startsWith('.mute') || userMessage === '.unmute' || userMessage.startsWith('.ban') || userMessage.startsWith('.unban') || userMessage.startsWith('.promote') || userMessage.startsWith('.demote')) && !isSenderAdmin && !message.key.fromMe) {
                await sock.sendMessage(chatId, { text: 'Only admins can use this.' });
                return;
            }
        }
        if (isOwnerCommand && !message.key.fromMe && !senderIsOwnerOrSudo) {
            await sock.sendMessage(chatId, { text: '❌ Owner only.' });
            return;
        }

        let commandExecuted = false;
        const allowWithoutPin = userMessage.startsWith('.pin');
        if (!allowWithoutPin) {
            try {
                const pinVerified = await checkPinVerification(senderId);
                if (!pinVerified) {
                    await sock.sendMessage(chatId, { text: '🔐 PIN required. Use .pin <code>' });
                    return;
                }
            } catch(e) {}
        }

        // ========== SWITCH (full original + new welcome/goodbye) ==========
        switch (true) {
            case userMessage === '.menu-general':
                await menuGeneral(sock, chatId, message);
                commandExecuted = true; break;
            case userMessage === '.menu-group':
                await menuGroup(sock, chatId, message);
                commandExecuted = true; break;
            case userMessage === '.menu-security':
                await menuSecurity(sock, chatId, message);
                commandExecuted = true; break;
            case userMessage === '.menu-ai':
                await menuAi(sock, chatId, message);
                commandExecuted = true; break;
            case userMessage === '.menu-download':
                await menuDownload(sock, chatId, message);
                commandExecuted = true; break;
            case userMessage === '.menu-effects':
                await menuEffects(sock, chatId, message);
                commandExecuted = true; break;
            case userMessage === '.menu-owner':
                await menuOwner(sock, chatId, message);
                commandExecuted = true; break;
            case userMessage === '.menu-settings':
                await menuSettings(sock, chatId, message);
                commandExecuted = true; break;
            case userMessage === '.menu-tools':
                await menuTools(sock, chatId, message);
                commandExecuted = true; break;
            case userMessage === '.menu-fun':
                await menuFun(sock, chatId, message);
                commandExecuted = true; break;
            case userMessage === '.menu-automation':
                await menuAutomation(sock, chatId, message);
                commandExecuted = true; break;
            case userMessage === '.menu-all':
                await menuAll(sock, chatId, message);
                commandExecuted = true; break;

            // New welcome/goodbye toggle commands
            case userMessage === '.welcome':
                await toggleWelcomeCommand(sock, chatId, message, rawText.split(' ').slice(1));
                commandExecuted = true; break;
            case userMessage === '.goodbye':
                await toggleGoodbyeCommand(sock, chatId, message, rawText.split(' ').slice(1));
                commandExecuted = true; break;

            // ==== ALL ORIGINAL COMMANDS (keep exactly as they were) ====
            case userMessage.startsWith('.add'):
                const addArgs = userMessage.trim().split(/\s+/);
                const phoneNumber = addArgs.slice(1).join(' ').trim();
                await addCommand(sock, chatId, senderId, phoneNumber, message);
                break;
            case userMessage.startsWith('.kick'):
                const mentionedJidListKick = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await kickCommand(sock, chatId, senderId, mentionedJidListKick, message);
                break;
            case userMessage.startsWith('.mute'): {
                const parts = userMessage.trim().split(/\s+/);
                const muteArg = parts[1];
                const muteDuration = muteArg !== undefined ? parseInt(muteArg, 10) : undefined;
                if (muteArg !== undefined && (isNaN(muteDuration) || muteDuration <= 0))
                    await sock.sendMessage(chatId, { text: 'Provide valid minutes' });
                else
                    await muteCommand(sock, chatId, senderId, message, muteDuration);
                break;
            }
            case userMessage === '.unmute':
                await unmuteCommand(sock, chatId, senderId);
                break;
            case userMessage.startsWith('.ban'):
                if (!isGroup && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Only owner/sudo can ban in PM' });
                    break;
                }
                await banCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.unban'):
                if (!isGroup && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Only owner/sudo can unban in PM' });
                    break;
                }
                await unbanCommand(sock, chatId, message);
                break;
            case userMessage === '.ping':
                await pingCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.pin'): {
                const pinArgs = userMessage.split(' ').slice(1);
                if (pinArgs[0] && /^\d+$/.test(pinArgs[0]))
                    await verifyPinCommand(sock, chatId, message, pinArgs[0]);
                else
                    await pinCommand(sock, chatId, message, pinArgs);
                commandExecuted = true;
                break;
            }
            case userMessage === '.help' || userMessage === '.menu' || userMessage === '.bot' || userMessage === '.list' || userMessage === '.cmd' || userMessage === '.commands':
                await helpCommand(sock, chatId, message, userMessage);
                commandExecuted = true;
                break;
            case userMessage === '.sticker' || userMessage === '.s':
                await stickerCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.gpstatus':
                await gpstatusCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.warnings'): {
                const mentionedJidListWarnings = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warningsCommand(sock, chatId, mentionedJidListWarnings);
                break;
            }
            case userMessage.startsWith('.warn'): {
                const mentionedJidListWarn = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warnCommand(sock, chatId, senderId, mentionedJidListWarn, message);
                break;
            }
            case userMessage.startsWith('.tts'): {
                const text = userMessage.slice(4).trim();
                await ttsCommand(sock, chatId, text, message);
                break;
            }
            case userMessage.startsWith('.delete') || userMessage.startsWith('.del'):
                await deleteCommand(sock, chatId, message, senderId);
                break;
            case userMessage === '.settings':
                await settingsCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.mode'): {
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: 'Only owner' });
                    return;
                }
                let data;
                try { data = JSON.parse(fs.readFileSync(countFilePath)); } catch(e) { data = { isPublic: true }; }
                const action = userMessage.split(' ')[1]?.toLowerCase();
                if (!action) {
                    const currentMode = data?.isPublic ? 'public' : 'private';
                    await sock.sendMessage(chatId, { text: `Mode: ${currentMode}\n.mode public/private` });
                    return;
                }
                if (action !== 'public' && action !== 'private') return;
                data.isPublic = action === 'public';
                fs.writeFileSync(countFilePath, JSON.stringify(data, null, 2));
                await sock.sendMessage(chatId, { text: `Mode set to ${action}` });
                break;
            }
            case userMessage.startsWith('.anticall'): {
                if (!message.key.fromMe && !senderIsOwnerOrSudo) break;
                const args = userMessage.split(' ').slice(1).join(' ');
                await anticallCommand(sock, chatId, message, args);
                break;
            }
            case userMessage.startsWith('.pmblocker'): {
                const args = userMessage.split(' ').slice(1).join(' ');
                await pmblockerCommand(sock, chatId, message, args);
                commandExecuted = true;
                break;
            }
            case userMessage.startsWith('.chatbot'): {
                const args = userMessage.split(' ').slice(1).join(' ');
                await groupChatbotToggleCommand(sock, chatId, message, args);
                break;
            }
            case userMessage === '.owner':
                await ownerCommand(sock, chatId);
                break;
            case userMessage === '.tagall':
                await tagAllCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.tagnotadmin':
                await tagNotAdminCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.hidetag'): {
                const messageText = rawText.slice(8).trim();
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                break;
            }
            case userMessage.startsWith('.tag'): {
                const messageText = rawText.slice(4).trim();
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await tagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                break;
            }
            case userMessage.startsWith('.antilink'): {
                if (!isGroup) return;
                if (!isBotAdmin) { await sock.sendMessage(chatId, { text: 'Make bot admin' }); return; }
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
            }
            case userMessage.startsWith('.antitag'): {
                if (!isGroup) return;
                if (!isBotAdmin) { await sock.sendMessage(chatId, { text: 'Make bot admin' }); return; }
                await handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
            }
            case userMessage.startsWith('.weather'): {
                const city = userMessage.slice(9).trim();
                if (city) await weatherCommand(sock, chatId, message, city);
                else await sock.sendMessage(chatId, { text: 'Specify city' });
                break;
            }
            case userMessage.startsWith('.report'): {
                const reportArgs = userMessage.slice(7).trim();
                await reportCommand(sock, chatId, message, reportArgs);
                break;
            }
            case userMessage.startsWith('.halotel'):
                await halotelCommand(sock, chatId, message, userMessage);
                break;
            case userMessage === '.topmembers':
                topMembers(sock, chatId, isGroup);
                break;
            case userMessage.startsWith('.compliment'):
                await complimentCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.lyrics') || userMessage.startsWith('.lyric'): {
                const songTitle = userMessage.split(' ').slice(1).join(' ');
                await lyricsCommand(sock, chatId, message, songTitle);
                break;
            }
            case userMessage === '.clear':
                if (isGroup) await clearCommand(sock, chatId);
                break;
            case userMessage.startsWith('.promote'): {
                const mentioned = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await promoteCommand(sock, chatId, mentioned, message);
                break;
            }
            case userMessage.startsWith('.demote'): {
                const mentioned = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await demoteCommand(sock, chatId, mentioned, message);
                break;
            }
            case userMessage === '.alive':
                await aliveCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.mention '): {
                const args = userMessage.split(' ').slice(1).join(' ');
                await mentionToggleCommand(sock, chatId, message, args, message.key.fromMe || senderIsSudo);
                break;
            }
            case userMessage.startsWith('.autobio'): {
                const args = userMessage.split(' ').slice(1).join(' ');
                await autoBioCommand(sock, chatId, message, args);
                break;
            }
            case userMessage.startsWith('.gmention '): {
                const args = userMessage.split(' ').slice(1).join(' ');
                await groupMentionToggleCommand(sock, chatId, message, args);
                break;
            }
            case userMessage === '.setmention':
                await setMentionCommand(sock, chatId, message, message.key.fromMe || senderIsSudo);
                break;
            case userMessage.startsWith('.blur'): {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                await blurCommand(sock, chatId, message, quotedMessage);
                break;
            }
            case userMessage.startsWith('.antibadword'): {
                if (!isGroup) return;
                const adminStat = await isAdmin(sock, chatId, senderId);
                const isAd = adminStat.isSenderAdmin;
                const isBotAd = adminStat.isBotAdmin;
                if (!isBotAd) { await sock.sendMessage(chatId, { text: 'Bot must be admin' }); return; }
                await antibadwordCommand(sock, chatId, message, senderId, isAd);
                break;
            }
            case userMessage.startsWith('.take') || userMessage.startsWith('.steal'): {
                const isSteal = userMessage.startsWith('.steal');
                const sliceLen = isSteal ? 6 : 5;
                const takeArgs = rawText.slice(sliceLen).trim().split(' ');
                await takeCommand(sock, chatId, message, takeArgs);
                break;
            }
            case userMessage.startsWith('.character'):
                await characterCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.waste'):
                await wastedCommand(sock, chatId, message);
                break;
            case userMessage === '.resetlink' || userMessage === '.revoke':
                if (!isGroup) return;
                await resetlinkCommand(sock, chatId, senderId);
                break;
            case userMessage.startsWith('.checkadmins'):
                if (!isGroup) return;
                await checkAdminsCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.checkadmin'):
                if (!isGroup) return;
                await checkAdminCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.antimention'): {
                const args = userMessage.split(' ').slice(1);
                await antimentionCommand(sock, chatId, message, args);
                break;
            }
            case userMessage.startsWith('.antimentionstatus'): {
                const args = userMessage.split(' ').slice(1);
                await antimentionstatusCommand(sock, chatId, message, args);
                break;
            }
            case userMessage.startsWith('.toimg'):
                await toimgCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.listonline'):
                await listonlineCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.antibot'): {
                const args = userMessage.split(' ').slice(1);
                await antibotCommand(sock, chatId, message, args);
                break;
            }
            case userMessage.startsWith('.mylve'):
                await mylveCommand(sock, chatId, message);
                break;
            case userMessage === '.staff' || userMessage === '.admins' || userMessage === '.listadmin':
                if (!isGroup) return;
                await staffCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.tourl') || userMessage.startsWith('.url'):
                await urlCommand(sock, chatId, message);
                break;
            case userMessage === '.autourl':
            case userMessage === '.audiourl':
                await autourlCommand.execute(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.emojimix') || userMessage.startsWith('.emix'):
                await emojimixCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.tg') || userMessage.startsWith('.stickertelegram'):
                await stickerTelegramCommand(sock, chatId, message);
                break;
            case userMessage === '.vv':
                await viewOnceCommand(sock, chatId, message);
                break;
            case userMessage === '.clearsession' || userMessage === '.clearsesi':
                await clearSessionCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.autostatus'): {
                const args = userMessage.split(' ').slice(1);
                await autoStatusCommand(sock, chatId, message, args);
                break;
            }
            case userMessage.startsWith('.metallic'): await textmakerCommand(sock,chatId,message,userMessage,'metallic'); break;
            case userMessage.startsWith('.ice'): await textmakerCommand(sock,chatId,message,userMessage,'ice'); break;
            case userMessage.startsWith('.snow'): await textmakerCommand(sock,chatId,message,userMessage,'snow'); break;
            case userMessage.startsWith('.impressive'): await textmakerCommand(sock,chatId,message,userMessage,'impressive'); break;
            case userMessage.startsWith('.matrix'): await textmakerCommand(sock,chatId,message,userMessage,'matrix'); break;
            case userMessage.startsWith('.light'): await textmakerCommand(sock,chatId,message,userMessage,'light'); break;
            case userMessage.startsWith('.neon'): await textmakerCommand(sock,chatId,message,userMessage,'neon'); break;
            case userMessage.startsWith('.devil'): await textmakerCommand(sock,chatId,message,userMessage,'devil'); break;
            case userMessage.startsWith('.purple'): await textmakerCommand(sock,chatId,message,userMessage,'purple'); break;
            case userMessage.startsWith('.thunder'): await textmakerCommand(sock,chatId,message,userMessage,'thunder'); break;
            case userMessage.startsWith('.leaves'): await textmakerCommand(sock,chatId,message,userMessage,'leaves'); break;
            case userMessage.startsWith('.1917'): await textmakerCommand(sock,chatId,message,userMessage,'1917'); break;
            case userMessage.startsWith('.arena'): await textmakerCommand(sock,chatId,message,userMessage,'arena'); break;
            case userMessage.startsWith('.hacker'): await textmakerCommand(sock,chatId,message,userMessage,'hacker'); break;
            case userMessage.startsWith('.sand'): await textmakerCommand(sock,chatId,message,userMessage,'sand'); break;
            case userMessage.startsWith('.blackpink'): await textmakerCommand(sock,chatId,message,userMessage,'blackpink'); break;
            case userMessage.startsWith('.glitch'): await textmakerCommand(sock,chatId,message,userMessage,'glitch'); break;
            case userMessage.startsWith('.fire'): await textmakerCommand(sock,chatId,message,userMessage,'fire'); break;
            case userMessage.startsWith('.antidelete'): {
                const args = userMessage.slice(11).trim();
                await handleAntideleteCommand(sock, chatId, message, args);
                break;
            }
            case userMessage === '.cleartmp':
                await clearTmpCommand(sock, chatId, message);
                break;
            case userMessage === '.setpp':
            case userMessage === '.pp':
                await setProfilePicture(sock, chatId, message);
                break;
            case userMessage.startsWith('.setgdesc'): {
                const text = rawText.slice(9).trim();
                await setGroupDescription(sock, chatId, senderId, text, message);
                break;
            }
            case userMessage.startsWith('.setgname'): {
                const text = rawText.slice(9).trim();
                await setGroupName(sock, chatId, senderId, text, message);
                break;
            }
            case userMessage.startsWith('.setgpp'):
                await setGroupPhoto(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.instagram') || userMessage.startsWith('.insta') || userMessage === '.ig' || userMessage.startsWith('.ig '):
                await instagramCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.igsc'):
                await igsCommand(sock, chatId, message, true);
                break;
            case userMessage.startsWith('.igs'):
                await igsCommand(sock, chatId, message, false);
                break;
            case userMessage.startsWith('.fb') || userMessage.startsWith('.facebook'):
                await facebookCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.music') || userMessage.startsWith('.play') || userMessage.startsWith('.mp3') || userMessage.startsWith('.ytmp3') || userMessage.startsWith('.song'):
                await playCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.video') || userMessage.startsWith('.ytmp4'):
                await videoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.tiktok') || userMessage.startsWith('.tt'):
                await tiktokCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.gpt') || userMessage.startsWith('.gemini'):
                await aiCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.aivoice') || userMessage.startsWith('.vai') || userMessage.startsWith('.voicex') || userMessage.startsWith('.voiceai'): {
                const voiceText = userMessage.replace(/^\.(aivoice|vai|voicex|voiceai)\s*/i, '');
                await aiVoiceCommand(sock, chatId, senderId, voiceText, message);
                break;
            }
            case userMessage.startsWith('.mickey'):
                await mickeyCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.bigmanj'): {
                const args = userMessage.slice(9);
                await bigmanjToggleCommand(sock, chatId, message, args);
                break;
            }
            case userMessage.startsWith('.translate') || userMessage.startsWith('.trt'): {
                const len = userMessage.startsWith('.translate') ? 10 : 4;
                await handleTranslateCommand(sock, chatId, message, userMessage.slice(len));
                break;
            }
            case userMessage.startsWith('.areact') || userMessage.startsWith('.autoreact'):
                await handleAreactCommand(sock, chatId, message, isOwnerOrSudoCheck);
                break;
            case userMessage.startsWith('.sudo'):
                await sudoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.imagine') || userMessage.startsWith('.flux') || userMessage.startsWith('.dalle'):
                await imagineCommand(sock, chatId, message);
                break;
            case userMessage === '.jid': {
                if (!isGroup) return;
                await sock.sendMessage(chatId, { text: `Group JID: ${chatId}` });
                break;
            }
            case userMessage.startsWith('.autotyping'):
                await autotypingCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.autoread'):
                await autoreadCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.crop':
                await stickercropCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.update'): {
                const parts = rawText.trim().split(/\s+/);
                const zipArg = parts[1] && parts[1].startsWith('http') ? parts[1] : '';
                await updateCommand(sock, chatId, message, zipArg);
                commandExecuted = true;
                break;
            }
            case userMessage.startsWith('.checkupdates'): {
                const args = userMessage.split(' ').slice(1);
                await checkUpdatesCommand(sock, chatId, message, args);
                commandExecuted = true;
                break;
            }
            case userMessage.startsWith('.newgroup'):
                await newgroupCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.gdrive'):
                await gdriveCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.getcode'): {
                const args = userMessage.split(' ').slice(1);
                await getcodeCommand(sock, chatId, message, args);
                break;
            }
            case userMessage.startsWith('.getlink'):
                await getlinkCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.shazam'):
                await shazamCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.repo'):
                await repoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.stats'):
                await statsCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.stickeralt'):
                await stickerAltCommand(sock, chatId, message);
                break;
            default:
                if (isGroup) {
                    await handleTagDetection(sock, chatId, message, senderId);
                    await handleMentionDetection(sock, chatId, message);
                }
                commandExecuted = false;
                break;
        }

        if (commandExecuted !== false) await showTypingAfterCommand(sock, chatId);
        if (userMessage.startsWith('.')) {
            await addCommandReaction(sock, message, commandExecuted !== false);
        }
    } catch (error) {
        console.error('❌ Message handler error:', error.message);
        const safeChatId = messageUpdate?.messages?.[0]?.key?.remoteJid;
        if (safeChatId) {
            await sock.sendMessage(safeChatId, { text: `❌ Error: ${error.message.slice(0, 200)}` }).catch(()=>{});
        }
    }
}

module.exports = {
    handleMessages,
    handleStatus,
    handleGroupParticipantUpdate,
    initOnlineTracker,
    handlePostUpdateMessage
};