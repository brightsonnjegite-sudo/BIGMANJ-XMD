const fs = require('fs/promises');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const CONFIG_FILE = path.join(__dirname, '../data/autoStatus.json');
const DEFAULT_CONFIG = Object.freeze({
    enabled: true,
    viewEnabled: true,
    likeEnabled: true,
});

const EMOJI_REACTIONS = ['❤️', '🔥', '😂', '👍', '🎉', '😍', '💯', '🙏', '😁'];

let configCache = null;
const processedStatusIds = new Set();

async function loadConfig() {
    if (configCache) return configCache;
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        configCache = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    } catch (err) {
        configCache = { ...DEFAULT_CONFIG };
        await saveConfig(configCache);
    }
    return configCache;
}

async function saveConfig(updates) {
    configCache = { ...configCache, ...updates };
    try {
        await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
        await fs.writeFile(CONFIG_FILE, JSON.stringify(configCache, null, 2), 'utf8');
    } catch (err) {
        console.error('[AutoStatus] Save failed:', err.message);
    }
}

function getRandomEmoji() {
    return EMOJI_REACTIONS[Math.floor(Math.random() * EMOJI_REACTIONS.length)];
}

async function autoView(sock, statusKey) {
    if (!statusKey?.id) return;
    try {
        // Inatuma "read receipt" kwa status maalum
        await sock.readMessages([statusKey]);
        
        // Njia mbadala ya kuhakikisha status imekuwa marked kama read
        if (statusKey.participant) {
            await sock.sendReceipt(statusKey.remoteJid, statusKey.participant, [statusKey.id], 'read');
        }
        
        console.log(`[AutoView] ✅ Status viewed: ${statusKey.id} from ${statusKey.participant}`);
    } catch (err) {
        console.error(`[AutoView] Failed:`, err.message);
    }
}

async function autoLike(sock, statusKey) {
    // Participant ni lazima ili reaction ifike kwa mtu sahihi
    if (!statusKey?.id || !statusKey?.participant) return;
    
    const emoji = getRandomEmoji();
    try {
        await sock.sendMessage('status@broadcast', {
            react: { 
                text: emoji, 
                key: statusKey 
            }
        }, { 
            // Hii inahakikisha reaction inaonekana kwa aliyeweka status
            statusJidList: [statusKey.participant] 
        });
        
        console.log(`[AutoLike] ✅ Reaction ${emoji} sent to: ${statusKey.participant}`);
    } catch (err) {
        console.error(`[AutoLike] Failed:`, err.message);
    }
}

async function handleStatusUpdate(sock, ev) {
    const cfg = await loadConfig();
    if (!cfg.enabled) return;

    // Kunasa (Capture) message ya status
    const msg = ev.messages?.[0];
    if (!msg || msg.key.remoteJid !== 'status@broadcast') return;

    const statusKey = msg.key;
    
    // Muhimu: Baadhi ya matoleo yanahitaji participant kutoka kwenye message yenyewe
    if (!statusKey.participant && msg.participant) {
        statusKey.participant = msg.participant;
    }

    if (!statusKey.id || processedStatusIds.has(statusKey.id)) return;
    processedStatusIds.add(statusKey.id);

    // Safisha cache ya IDs ikizidi 1500 (Memory management)
    if (processedStatusIds.size > 1500) {
        const arr = Array.from(processedStatusIds);
        processedStatusIds.clear();
        arr.slice(-750).forEach(id => processedStatusIds.add(id));
    }

    // Tekeleza kwa pamoja (Concurrent execution)
    const tasks = [];
    if (cfg.viewEnabled) tasks.push(autoView(sock, statusKey));
    if (cfg.likeEnabled) tasks.push(autoLike(sock, statusKey));
    
    await Promise.allSettled(tasks);
}

async function autoStatusCommand(sock, chatId, msg, args = []) {
    try {
        const sender = msg.key.participant || msg.key.remoteJid;
        const isAllowed = msg.key.fromMe || (await isOwnerOrSudo(sender, sock, chatId));
        if (!isAllowed) return;

        const sub = (args[0] || '').toLowerCase();
        const option = (args[1] || '').toLowerCase();

        if (sub === 'on') {
            await saveConfig({ enabled: true, viewEnabled: true, likeEnabled: true });
            return sock.sendMessage(chatId, { text: '✅ *Auto Status:* Enabled (View + Like).' });
        }

        if (sub === 'off') {
            await saveConfig({ enabled: false });
            return sock.sendMessage(chatId, { text: '❌ *Auto Status:* Disabled.' });
        }

        const cfg = await loadConfig();

        if (sub === 'view') {
            const val = option === 'on';
            await saveConfig({ viewEnabled: val });
            return sock.sendMessage(chatId, { text: `👁️ *Auto View:* ${val ? 'ON' : 'OFF'}` });
        }

        if (sub === 'like') {
            const val = option === 'on';
            await saveConfig({ likeEnabled: val });
            return sock.sendMessage(chatId, { text: `❤️ *Auto Like:* ${val ? 'ON' : 'OFF'}` });
        }

        // Default: Onyesha menu ya settings
        return sock.sendMessage(chatId, {
            text: `📊 *Auto Status Settings:*
• Overall: ${cfg.enabled ? '✅' : '❌'}
• View: ${cfg.viewEnabled ? '✅' : '❌'}
• Like: ${cfg.likeEnabled ? '✅' : '❌'}

*Commands:*
.autostatus on | off
.autostatus view on | off
.autostatus like on | off`,
        });
    } catch (err) {
        console.error('[AutoStatus] Cmd error:', err.message);
    }
}

module.exports = autoStatusCommand;
module.exports.handleStatusUpdate = handleStatusUpdate;
