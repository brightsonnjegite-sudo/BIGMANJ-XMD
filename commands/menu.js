const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

// ==================== HELPER FUNCTIONS ====================
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
    const hour = moment().hour();
    if (hour >= 5 && hour < 12) return 'Habari za Asubuhi ☀️';
    if (hour >= 12 && hour < 18) return 'Habari za Mchana 🌤️';
    return 'Habari za Jioni 🌙';
};

// Extract numeric part from JID (e.g., "255777580820@s.whatsapp.net" -> "255777580820")
const getMentionNumber = (jid) => jid.split('@')[0];

// ==================== MENU DATA ====================
// Image URLs – replace with your own theme images if needed
const IMAGES = {
    main: 'https://i.ibb.co/cX8ysKLT/RD32363337313436343437363340732e77686174736170702e6e6574-554891.jpg', // Dog Crasher
    general: 'https://picsum.photos/id/20/800/400',  // Premium Blue theme
    group: 'https://picsum.photos/id/104/800/400',   // Group Manager theme
    security: 'https://picsum.photos/id/0/800/400',  // Cyber Security theme
    download: 'https://picsum.photos/id/29/800/400', // Neon Download theme
    fun: 'https://picsum.photos/id/169/800/400',     // Anime Fun theme
    effects: 'https://picsum.photos/id/96/800/400',  // Purple Effects theme
    ai: 'https://picsum.photos/id/119/800/400',      // Future AI theme
    owner: 'https://picsum.photos/id/104/800/400'    // Gold King theme
};

// Submenu command lists (as specified by the user)
const SUBMENUS = {
    'menu-general': {
        title: '📂 GENERAL MENU',
        commands: [
            '.help', '.ping', '.alive', '.owner', '.repo',
            '.stats', '.settings', '.checkupdates'
        ]
    },
    'menu-group': {
        title: '👥 GROUP MENU',
        commands: [
            '.add', '.kick', '.promote', '.demote', '.tagall',
            '.tagnotadmin', '.hidetag', '.tag', '.mention',
            '.setmention', '.setgname', '.setgdesc', '.setgpp'
        ]
    },
    'menu-security': {
        title: '🛡️ SECURITY MENU',
        commands: [
            '.antibot', '.antilink', '.antimention', '.antimentionstatus',
            '.antibadword', '.anticall', '.pmblocker', '.antitag',
            '.ban', '.unban', '.resetlink'
        ]
    },
    'menu-download': {
        title: '📥 DOWNLOAD MENU',
        commands: [
            '.play', '.video', '.music', '.facebook', '.instagram',
            '.igs', '.igsc', '.tiktok', '.gdrive', '.url'
        ]
    },
    'menu-fun': {
        title: '🎮 FUN MENU',
        commands: [
            '.truth', '.dare', '.joke', '.compliment', '.lyrics',
            '.character', '.weather', '.report', '.wasted', '.mickey'
        ]
    },
    'menu-effects': {
        title: '✨ EFFECTS MENU',
        commands: [
            '.metallic', '.ice', '.snow', '.impressive', '.matrix',
            '.light', '.neon', '.devil', '.purple', '.thunder',
            '.leaves', '.1917', '.arena', '.hacker', '.sand',
            '.blackpink', '.glitch', '.fire'
        ]
    },
    'menu-ai': {
        title: '🤖 AI MENU',
        commands: [
            '.gpt', '.aivoice', '.imagine', '.ghost', '.getcode', '.getlink'
        ]
    },
    'menu-owner': {
        title: '👑 OWNER MENU',
        commands: [
            '.sudo', '.update', '.newgroup', '.autostatus',
            '.autotyping', '.autoread', '.areact'
        ]
    }
};

// ==================== MAIN MENU ====================
const sendMainMenu = async (sock, chatId, m, senderId, userName) => {
    moment.tz.setDefault('Africa/Dar_es_Salaam');
    const now = moment();
    const greeting = getGreeting();
    const mentionNumber = getMentionNumber(senderId);
    const ownerNumber = '255777580820';
    const ownerName = 'BIGMANj';

    let caption = '';
    caption += '🩸━━━━━━━━━━━━━━━━━━🩸\n';
    caption += '     *BIGMANj BOT*\n';
    caption += '🩸━━━━━━━━━━━━━━━━━━🩸\n\n';
    caption += `👋 ${greeting} @${mentionNumber}\n\n`;
    caption += `👑 Owner      : ${ownerName}\n`;
    caption += `📞 Owner No   : ${ownerNumber}\n`;
    caption += `⚡ Commands   : Auto Count\n`;
    caption += `🚀 Runtime    : ${formatUptime(process.uptime())}\n`;
    caption += `📅 Date       : ${now.format('DD/MM/YYYY')}\n`;
    caption += `⏰ Time       : ${now.format('HH:mm:ss')}\n\n`;
    caption += '🩸 FEAR THE CRASHER 🩸\n\n';
    caption += '📂 *AVAILABLE MENUS*\n';
    caption += '• .menu-general\n';
    caption += '• .menu-group\n';
    caption += '• .menu-security\n';
    caption += '• .menu-download\n';
    caption += '• .menu-fun\n';
    caption += '• .menu-effects\n';
    caption += '• .menu-ai\n';
    caption += '• .menu-owner\n\n';
    caption += '> bigmanj tech™';

    await sock.sendMessage(chatId, {
        image: { url: IMAGES.main },
        caption: caption,
        mentions: [senderId]
    }, { quoted: m });

    // Send audio only for main menu
    const audioPath = path.join(__dirname, '../assets/holy-drill-yeshua.mp3');
    setTimeout(async () => {
        try {
            if (fs.existsSync(audioPath)) {
                const audioBuffer = fs.readFileSync(audioPath);
                await sock.sendMessage(chatId, {
                    audio: audioBuffer,
                    mimetype: 'audio/mp4',
                    ptt: true
                }, { quoted: m });
            } else {
                await sock.sendMessage(chatId, {
                    text: '🎵 *Holy Drill - Yeshua*\n(Wimbo unapatikana CeeNaija au YouTube)'
                }, { quoted: m });
            }
        } catch (err) {
            console.error('Audio error:', err.message);
        }
    }, 2500);
};

// ==================== SUBMENU GENERATOR ====================
const sendSubMenu = async (sock, chatId, m, senderId, menuKey) => {
    const menu = SUBMENUS[menuKey];
    if (!menu) return false;

    const userName = m.pushName || 'User';
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

    // Determine image for this menu
    let imageUrl = IMAGES.main; // fallback
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

// ==================== MAIN HANDLER ====================
const menuHandler = async (sock, chatId, m) => {
    try {
        const text = getMessageText(m).trim().toLowerCase();
        if (!text.startsWith('.menu')) return; // ignore non-menu commands

        const senderId = m.key.participant || m.key.remoteJid;
        const userName = m.pushName || 'User';

        // Main menu
        if (text === '.menu') {
            await sendMainMenu(sock, chatId, m, senderId, userName);
            return;
        }

        // Submenus
        const submenuKey = text.substring(1); // remove the dot
        if (SUBMENUS[submenuKey]) {
            await sendSubMenu(sock, chatId, m, senderId, submenuKey);
        } else {
            // Optional: reply with error for unknown .menu-xxx
            await sock.sendMessage(chatId, {
                text: '❌ Submenu haipo. Tumia .menu kuona orodha sahihi.'
            }, { quoted: m });
        }
    } catch (error) {
        console.error('Menu handler error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Kuna hitilafu. Jaribu tena.'
        }, { quoted: m });
    }
};

module.exports = menuHandler;