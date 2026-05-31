const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Hakikisha umesakinisha: npm install axios

// --------------------------------------------------------------
// 1. HELPER FUNCTIONS
// --------------------------------------------------------------
const getMessageText = (m) => {
    if (m.message?.conversation) return m.message.conversation;
    if (m.message?.extendedTextMessage?.text) return m.message.extendedTextMessage.text;
    return '';
};

const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
};

const getGreeting = () => {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return 'Habari za Asubuhi ☀️';
    if (hour >= 12 && hour < 18) return 'Habari za Mchana 🌤️';
    return 'Habari za Jioni 🌙';
};

const getMentionNumber = (jid) => jid.split('@')[0];

// --------------------------------------------------------------
// 2. PICHA ZA KILA SUBMENU (Badilisha URLs zako hapa)
// --------------------------------------------------------------
const IMAGES = {
    main: 'https://i.ibb.co/cX8ysKLT/RD32363337313436343437363340732e77686174736170702e6e6574-554891.jpg', // Dog Crasher
    general: 'https://picsum.photos/id/20/800/400',
    group: 'https://picsum.photos/id/104/800/400',
    security: 'https://picsum.photos/id/0/800/400',
    download: 'https://picsum.photos/id/29/800/400',
    fun: 'https://picsum.photos/id/169/800/400',
    effects: 'https://picsum.photos/id/96/800/400',
    ai: 'https://picsum.photos/id/119/800/400',
    owner: 'https://picsum.photos/id/104/800/400'
};

// --------------------------------------------------------------
// 3. SUBMENU ORODHA ZA COMMANDS
// --------------------------------------------------------------
const SUBMENUS = {
    'menu-general': {
        title: '📂 GENERAL MENU',
        commands: ['.help', '.ping', '.alive', '.owner', '.repo', '.stats', '.settings', '.checkupdates']
    },
    'menu-group': {
        title: '👥 GROUP MENU',
        commands: ['.add', '.kick', '.promote', '.demote', '.tagall', '.tagnotadmin', '.hidetag', '.tag', '.mention', '.setmention', '.setgname', '.setgdesc', '.setgpp']
    },
    'menu-security': {
        title: '🛡️ SECURITY MENU',
        commands: ['.antibot', '.antilink', '.antimention', '.antimentionstatus', '.antibadword', '.anticall', '.pmblocker', '.antitag', '.ban', '.unban', '.resetlink']
    },
    'menu-download': {
        title: '📥 DOWNLOAD MENU',
        commands: ['.play', '.video', '.music', '.facebook', '.instagram', '.igs', '.igsc', '.tiktok', '.gdrive', '.url']
    },
    'menu-fun': {
        title: '🎮 FUN MENU',
        commands: ['.truth', '.dare', '.joke', '.compliment', '.lyrics', '.character', '.weather', '.report', '.wasted', '.mickey']
    },
    'menu-effects': {
        title: '✨ EFFECTS MENU',
        commands: ['.metallic', '.ice', '.snow', '.impressive', '.matrix', '.light', '.neon', '.devil', '.purple', '.thunder', '.leaves', '.1917', '.arena', '.hacker', '.sand', '.blackpink', '.glitch', '.fire']
    },
    'menu-ai': {
        title: '🤖 AI MENU',
        commands: ['.gpt', '.aivoice', '.imagine', '.ghost', '.getcode', '.getlink']
    },
    'menu-owner': {
        title: '👑 OWNER MENU',
        commands: ['.sudo', '.update', '.newgroup', '.autostatus', '.autotyping', '.autoread', '.areact']
    }
};

// --------------------------------------------------------------
// 4. KUPASUA AUDIO KUTOKA URL NA KUITUMA
// --------------------------------------------------------------
const AUDIO_URL = 'https://files.catbox.moe/0mn7pe.mp3';

async function sendAudioFromUrl(sock, chatId, quotedMsg) {
    try {
        // Pakua audio kwa kutumia axios
        const response = await axios.get(AUDIO_URL, {
            responseType: 'arraybuffer',
            timeout: 30000
        });
        const audioBuffer = Buffer.from(response.data);
        
        // Tuma kama PTT (voice note)
        await sock.sendMessage(chatId, {
            audio: audioBuffer,
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: quotedMsg });
        console.log('✅ Audio imetumwa kikamilifu kutoka URL');
    } catch (err) {
        console.error('❌ Kosa la kutuma audio:', err.message);
        // Usitume maandishi – tunataka kimya kwa error
    }
}

// --------------------------------------------------------------
// 5. SEND MAIN MENU (Picha + Caption + Audio)
// --------------------------------------------------------------
const sendMainMenu = async (sock, chatId, m, senderId) => {
    moment.tz.setDefault('Africa/Dar_es_Salaam');
    const now = moment();
    const greeting = getGreeting();
    const mentionNumber = getMentionNumber(senderId);
    const runtime = formatUptime(process.uptime());
    const date = now.format('DD/MM/YYYY');
    const time = now.format('HH:mm:ss');

    let caption = '';
    caption += `✨ ΥΟ!!, @${mentionNumber}\n\n`;
    caption += `🤖 Τhis is ΒΙGMANj ΒΟΤ, a WhatsApp Automation Tool developed in collaboration with Ωuantum Βase Developer.\n\n`;
    caption += `🌵 Group Management\n`;
    caption += `🛡️ Security System\n`;
    caption += `🤖 AI Features\n`;
    caption += `📥 Download System\n`;
    caption += `✨ Effects & Logo Maker\n`;
    caption += `👑 Owner Controls\n\n`;
    caption += `🚀 ΒΙGMANj ΒΟΤ — Fast, Powerful & Reliable\n\n`;
    caption += `📅 ${date}  |  ⏰ ${time}  |  ⏱️ Uptime: ${runtime}\n\n`;
    caption += `> bigmanj tech™`;

    // Tuma picha na caption
    await sock.sendMessage(chatId, {
        image: { url: IMAGES.main },
        caption: caption,
        mentions: [senderId]
    }, { quoted: m });

    // Tuma audio baada ya sekunde 2 (kutoka URL)
    setTimeout(async () => {
        await sendAudioFromUrl(sock, chatId, m);
    }, 2000);
};

// --------------------------------------------------------------
// 6. SEND SUBMENU (Picha tu, hakuna audio)
// --------------------------------------------------------------
const sendSubMenu = async (sock, chatId, m, senderId, menuKey) => {
    const menu = SUBMENUS[menuKey];
    if (!menu) return false;

    const greeting = getGreeting();
    const mentionNumber = getMentionNumber(senderId);

    let caption = '';
    caption += `👋 ${greeting} @${mentionNumber}\n\n`;
    caption += `${menu.title}\n`;
    caption += '━━━━━━━━━━━━━━━━━━━━━━\n';
    for (const cmd of menu.commands) {
        caption += `• ${cmd}\n`;
    }
    caption += '\n> bigmanj tech™';

    let imageUrl = IMAGES.main;
    if (menuKey === 'menu-general') imageUrl = IMAGES.general;
    else if (menuKey === 'menu-group') imageUrl = IMAGES.group;
    else if (menuKey === 'menu-security') imageUrl = IMAGES.security;
    else if (menuKey === 'menu-download') imageUrl = IMAGES.download;
    else if (menuKey === 'menu-fun') imageUrl = IMAGES.fun;
    else if (menuKey === 'menu-effects') imageUrl = IMAGES.effects;
    else if (menuKey === 'menu-ai') imageUrl = IMAGES.ai;
    else if (menuKey === 'menu-owner') imageUrl = IMAGES.owner;

    await sock.sendMessage(chatId, {
        image: { url: imageUrl },
        caption: caption,
        mentions: [senderId]
    }, { quoted: m });

    return true;
};

// --------------------------------------------------------------
// 7. MAIN COMMAND EXPORT
// --------------------------------------------------------------
const menuHandler = async (sock, chatId, m) => {
    try {
        const text = getMessageText(m).trim().toLowerCase();
        if (!text.startsWith('.menu')) return;

        const senderId = m.key.participant || m.key.remoteJid;

        if (text === '.menu') {
            await sendMainMenu(sock, chatId, m, senderId);
            return;
        }

        const submenuKey = text.substring(1);
        if (SUBMENUS[submenuKey]) {
            await sendSubMenu(sock, chatId, m, senderId, submenuKey);
        } else {
            await sock.sendMessage(chatId, {
                text: '❌ Submenu haipo. Tumia *.menu* kuona orodha.'
            }, { quoted: m });
        }
    } catch (error) {
        console.error('Menu handler error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Kuna hitilafu katika menu. Jaribu tena.'
        }, { quoted: m });
    }
};

module.exports = menuHandler;