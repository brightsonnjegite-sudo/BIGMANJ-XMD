/**
 * BIGMANJ BOT V3 - MENU / HELP COMMAND
 * Clean & Organized - All commands grouped by category
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get bot uptime
function getUptime() {
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

// Main help function
async function helpCommand(sock, chatId, message, args) {
    try {
        // If args is a number (menu page), handle submenu navigation
        const arg = (args || '').trim();
        const page = parseInt(arg);
        if (!isNaN(page) && page >= 1 && page <= 12) {
            await showCategoryPage(sock, chatId, page, message);
            return;
        }

        // If specific category command like .menu-general
        if (arg === 'general' || arg === '-general') {
            await showCategoryPage(sock, chatId, 1, message);
            return;
        }
        if (arg === 'group' || arg === '-group') {
            await showCategoryPage(sock, chatId, 2, message);
            return;
        }
        if (arg === 'security' || arg === '-security') {
            await showCategoryPage(sock, chatId, 3, message);
            return;
        }
        if (arg === 'ai' || arg === '-ai') {
            await showCategoryPage(sock, chatId, 4, message);
            return;
        }
        if (arg === 'download' || arg === '-download') {
            await showCategoryPage(sock, chatId, 5, message);
            return;
        }
        if (arg === 'effects' || arg === '-effects') {
            await showCategoryPage(sock, chatId, 6, message);
            return;
        }
        if (arg === 'owner' || arg === '-owner') {
            await showCategoryPage(sock, chatId, 7, message);
            return;
        }
        if (arg === 'settings' || arg === '-settings') {
            await showCategoryPage(sock, chatId, 8, message);
            return;
        }
        if (arg === 'tools' || arg === '-tools') {
            await showCategoryPage(sock, chatId, 9, message);
            return;
        }
        if (arg === 'fun' || arg === '-fun') {
            await showCategoryPage(sock, chatId, 10, message);
            return;
        }
        if (arg === 'automation' || arg === '-automation') {
            await showCategoryPage(sock, chatId, 11, message);
            return;
        }
        if (arg === 'all' || arg === '-all') {
            await showCategoryPage(sock, chatId, 12, message);
            return;
        }

        // Default: show main menu with categories
        const uptime = getUptime();
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        const version = packageJson.version || '3.0.0';
        
        const menuText = `╭━━━━━━━━━━━━━━━━━━━━╮
┃  *🤖 BIGMANJ BOT V3*  
┃  *Version:* ${version}
┃  *Uptime:* ${uptime}
┃  *Commands:* 100+
╰━━━━━━━━━━━━━━━━━━━━╯

*📂 CATEGORIES (Send number or .menu <name>)*

1️⃣ *General* – .menu general  
2️⃣ *Group* – .menu group  
3️⃣ *Security* – .menu security  
4️⃣ *AI & Chat* – .menu ai  
5️⃣ *Download* – .menu download  
6️⃣ *Effects* – .menu effects  
7️⃣ *Owner* – .menu owner  
8️⃣ *Settings* – .menu settings  
9️⃣ *Tools* – .menu tools  
🔟 *Fun* – .menu fun  
1️⃣1️⃣ *Automation* – .menu automation  
1️⃣2️⃣ *All Commands* – .menu all

*Example:* \`.menu 3\` or \`.menu security\`

━━━━━━━━━━━━━━━━━━━━
© bigmanj tech ™ with ♥︎ 🤖`;

        await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
    } catch (err) {
        console.error('Menu error:', err);
        await sock.sendMessage(chatId, { text: '❌ Error loading menu.' });
    }
}

// Category pages
async function showCategoryPage(sock, chatId, page, message) {
    const categories = {
        1: { name: '📡 *GENERAL COMMANDS*', list: [
            '.help / .menu – Show this menu',
            '.alive – Check bot status',
            '.ping – Bot latency',
            '.owner – Bot owner info',
            '.repo – GitHub repository',
            '.stats – Bot statistics',
            '.settings – Current bot settings',
            '.jid – Get group JID',
            '.staff – List group admins'
        ]},
        2: { name: '👥 *GROUP COMMANDS*', list: [
            '.tagall – Mention all members',
            '.tagnotadmin – Mention non‑admins',
            '.hidetag – Hidden mention',
            '.tag – Custom mention message',
            '.promote @user – Make admin',
            '.demote @user – Remove admin',
            '.kick @user – Remove member',
            '.add 255xxx – Add by phone',
            '.mute [minutes] – Mute group',
            '.unmute – Unmute group',
            '.resetlink – Revoke invite link',
            '.setgdesc <text> – Change description',
            '.setgname <name> – Change group name',
            '.setgpp – Change group photo',
            '.checkadmins – List all admins',
            '.checkadmin – Check if you are admin',
            '.listonline – See online members'
        ]},
        3: { name: '🔒 *SECURITY COMMANDS*', list: [
            '.anticall on/off/status – Call blocking',
            '.antilink on/off – Block links',
            '.antitag on/off – Block @all/@everyone',
            '.antimention on/off – Block mentions',
            '.antimentionstatus – Status',
            '.antibot on/off – Block other bots',
            '.antibadword on/off – Block bad words',
            '.warn @user – Warn member',
            '.warnings @user – Check warnings',
            '.ban @user – Ban user',
            '.unban @user – Unban user',
            '.pmblocker on/off – Block private messages'
        ]},
        4: { name: '🤖 *AI & CHAT COMMANDS*', list: [
            '.gpt <question> – ChatGPT / Gemini',
            '.aivoice <text> – Voice reply',
            '.chatbot on/off – Toggle AI in group',
            '.bigmanj on/off – Toggle Bigmanj mode',
            '.translate <text> – Translate to English',
            '.trt <lang> <text> – Translate',
            '.imagine <prompt> – Generate image',
            '.flux – Alternative image gen',
            '.dalle – DALL‑E image gen'
        ]},
        5: { name: '📥 *DOWNLOAD COMMANDS*', list: [
            '.play / .music <song> – Download audio',
            '.video <query> – Download video',
            '.ytmp3 <url> – YouTube to MP3',
            '.ytmp4 <url> – YouTube to MP4',
            '.instagram <url> – Download IG',
            '.ig <url> – Instagram video/photo',
            '.igs <username> – Story download',
            '.fb / .facebook <url> – Facebook',
            '.tiktok / .tt <url> – TikTok',
            '.gdrive <url> – Google Drive'
        ]},
        6: { name: '🎨 *EFFECTS COMMANDS*', list: [
            '.blur – Blur image/sticker',
            '.toimg – Convert sticker to image',
            '.take – Change sticker packname',
            '.steal – Steal sticker metadata',
            '.crop – Crop sticker',
            '.stickeralt – Alternative sticker maker',
            '.emojimix 😀+😢 – Mix emojis',
            '.waste – Wasted effect',
            '.character – Text to character art',
            '.mickey – Special effect'
        ]},
        7: { name: '👑 *OWNER COMMANDS*', list: [
            '.mode public/private – Bot visibility',
            '.autostatus on/off – Auto view status',
            '.antidelete on/off – Detect deleted messages',
            '.clearsession – Clear auth session',
            '.cleartmp – Clear temp files',
            '.setpp – Set bot profile picture',
            '.sudo add/remove – Manage sudo users',
            '.update – Update bot from repo',
            '.checkupdates – Check for updates',
            '.newgroup – Create new group'
        ]},
        8: { name: '⚙️ *SETTINGS COMMANDS*', list: [
            '.autotyping on/off – Fake typing',
            '.autoread on/off – Auto read messages',
            '.autobio <text> – Auto changing bio',
            '.areact on/off – Auto react to commands',
            '.autourl on/off – Auto shorten URLs',
            '.mention on/off – Mention alerts',
            '.gmention on/off – Group mention alerts',
            '.setmention – Configure mention reply'
        ]},
        9: { name: '🛠️ *TOOLS COMMANDS*', list: [
            '.weather <city> – Weather info',
            '.tts <text> – Text to speech',
            '.lyrics <song> – Song lyrics',
            '.shazam – Identify song from audio',
            '.getlink – Get invite link',
            '.getcode – Get group invite code',
            '.url / .tourl – Upload media to URL',
            '.repo – Bot repository link',
            '.compliment – Random compliment',
            '.report <issue> – Report to owner',
            '.delete / .del – Delete bot message'
        ]},
        10: { name: '🎉 *FUN COMMANDS*', list: [
            '.sticker / .s – Make sticker',
            '.stickertelegram – Telegram sticker',
            '.stickercrop – Crop sticker',
            '.emojimix – Mix emojis',
            '.character – ASCII art',
            '.waste – Meme effect',
            '.blur – Blur effect',
            '.mylve – Love calculator',
            '.topmembers – Active members stats',
            '.compliment – Random compliment'
        ]},
        11: { name: '⚡ *AUTOMATION COMMANDS*', list: [
            '.chatbot on/off – AI replies',
            '.bigmanj on/off – Special mode',
            '.autostatus – Auto view status',
            '.antilink – Auto delete links',
            '.antitag – Auto delete mass mentions',
            '.antimention – Auto delete mentions',
            '.antibadword – Auto delete bad words',
            '.anticall – Auto reject calls',
            '.pmblocker – Auto block PMs'
        ]},
        12: { name: '📜 *ALL COMMANDS*', list: [
            'Use .menu <category> to see detailed lists.',
            'Categories: general, group, security, ai, download, effects, owner, settings, tools, fun, automation',
            '',
            'Prefix: `.` (dot)',
            'Example: .help general',
            '',
            '🤖 *BIGMANJ BOT V3*',
            '© bigmanj tech ™ with ♥︎'
        ]}
    };

    const category = categories[page];
    if (!category) {
        await sock.sendMessage(chatId, { text: '❌ Invalid category number. Use 1-12.' });
        return;
    }

    let msg = `*${category.name}*\n━━━━━━━━━━━━━━━━━━━━\n`;
    for (const cmd of category.list) {
        msg += `▸ ${cmd}\n`;
    }
    msg += `\n━━━━━━━━━━━━━━━━━━━━\n© bigmanj tech ™ with ♥︎ 🤖`;
    
    await sock.sendMessage(chatId, { text: msg }, { quoted: message });
}

// Helper: return all command names (used by main.js for auto-detection)
function getAllCommands() {
    return [
        'help', 'menu', 'alive', 'ping', 'owner', 'repo', 'stats', 'settings', 'jid', 'staff',
        'tagall', 'tagnotadmin', 'hidetag', 'tag', 'promote', 'demote', 'kick', 'add', 'mute', 'unmute',
        'resetlink', 'setgdesc', 'setgname', 'setgpp', 'checkadmins', 'checkadmin', 'listonline',
        'anticall', 'antilink', 'antitag', 'antimention', 'antimentionstatus', 'antibot', 'antibadword',
        'warn', 'warnings', 'ban', 'unban', 'pmblocker',
        'gpt', 'aivoice', 'chatbot', 'bigmanj', 'translate', 'trt', 'imagine', 'flux', 'dalle',
        'play', 'music', 'video', 'ytmp3', 'ytmp4', 'instagram', 'ig', 'igs', 'fb', 'facebook', 'tiktok', 'tt', 'gdrive',
        'blur', 'toimg', 'take', 'steal', 'crop', 'stickeralt', 'emojimix', 'waste', 'character', 'mickey',
        'mode', 'autostatus', 'antidelete', 'clearsession', 'cleartmp', 'setpp', 'sudo', 'update', 'checkupdates', 'newgroup',
        'autotyping', 'autoread', 'autobio', 'areact', 'autourl', 'mention', 'gmention', 'setmention',
        'weather', 'tts', 'lyrics', 'shazam', 'getlink', 'getcode', 'url', 'tourl', 'compliment', 'report', 'delete', 'del',
        'sticker', 's', 'stickertelegram', 'stickercrop', 'mylve', 'topmembers'
    ];
}

module.exports = helpCommand;
module.exports.getAllCommands = getAllCommands;