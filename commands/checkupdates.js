const isOwnerOrSudo = require('../lib/isOwner');
const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

// Configuration
const REMINDER_FILE = path.join(__dirname, '../data/updateReminder.json');
const VERSION_FILE = path.join(__dirname, '../data/currentVersion.json');
const LOCAL_HASH_FILE = path.join(__dirname, '../data/localHash.json');
const REPO_OWNER = 'brightsonnjegite-sudo';
const REPO_NAME = 'Mickey-Glitch';

let reminderCache = null;

async function loadReminder() {
    if (reminderCache) return reminderCache;
    try {
        const data = await fs.readFile(REMINDER_FILE, 'utf8');
        reminderCache = JSON.parse(data);
    } catch {
        reminderCache = { lastCheck: null, updateFound: false, updateHash: null, autoReminder: false };
        await saveReminder();
    }
    return reminderCache;
}

async function saveReminder() {
    try {
        await fs.mkdir(path.dirname(REMINDER_FILE), { recursive: true });
        await fs.writeFile(REMINDER_FILE, JSON.stringify(reminderCache, null, 2));
    } catch (err) {
        console.error('[UpdateReminder] Save failed:', err.message);
    }
}

// Compute hash of ALL important local files (including non-js)
async function computeLocalHash() {
    const rootDir = path.join(__dirname, '..');
    // Folders to ignore completely
    const ignoreDirs = ['node_modules', 'data', 'auth_info', '.git', 'tmp', 'logs'];
    // Files to always ignore
    const ignoreFiles = ['.env', '.DS_Store', 'package-lock.json'];
    // File extensions to include (or specific filenames)
    const includeExtensions = ['.js', '.json', '.md', '.txt', '.example', '.yml', '.yaml'];
    // Specific filenames without extension
    const includeExact = ['Procfile', '.env.example', 'Dockerfile', 'config', 'settings'];

    const files = [];

    async function walkDir(dir) {
        const items = await fs.readdir(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (ignoreDirs.includes(item.name)) continue;
            if (ignoreFiles.includes(item.name)) continue;
            if (item.isDirectory()) {
                await walkDir(fullPath);
            } else if (item.isFile()) {
                const ext = path.extname(item.name);
                const shouldInclude = includeExtensions.includes(ext) || includeExact.includes(item.name);
                if (shouldInclude) {
                    files.push(fullPath);
                }
            }
        }
    }

    await walkDir(rootDir);
    files.sort(); // ensure consistent order

    const hash = crypto.createHash('sha256');
    for (const file of files) {
        try {
            const content = await fs.readFile(file);
            hash.update(file);
            hash.update(content);
        } catch (err) {
            // skip unreadable files
        }
    }
    return hash.digest('hex');
}

async function getStoredLocalHash() {
    try {
        const data = await fs.readFile(LOCAL_HASH_FILE, 'utf8');
        return JSON.parse(data).hash;
    } catch {
        return null;
    }
}

async function saveLocalHash(hash) {
    await fs.mkdir(path.dirname(LOCAL_HASH_FILE), { recursive: true });
    await fs.writeFile(LOCAL_HASH_FILE, JSON.stringify({ hash, updatedAt: new Date().toISOString() }, null, 2));
}

async function getLatestCommit() {
    const repoInfo = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
        headers: { 'User-Agent': 'MickeyBot' }
    });
    const defaultBranch = repoInfo.data.default_branch;
    const commitRes = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${defaultBranch}`, {
        headers: { 'User-Agent': 'MickeyBot' }
    });
    return { sha: commitRes.data.sha, branch: defaultBranch };
}

async function getStoredVersion() {
    try {
        const data = await fs.readFile(VERSION_FILE, 'utf8');
        return JSON.parse(data).sha;
    } catch {
        return null;
    }
}

async function saveVersion(sha) {
    await fs.mkdir(path.dirname(VERSION_FILE), { recursive: true });
    await fs.writeFile(VERSION_FILE, JSON.stringify({ sha, updatedAt: new Date().toISOString() }, null, 2));
}

async function checkForUpdates() {
    try {
        const { sha: latestSha, branch } = await getLatestCommit();
        let currentSha = await getStoredVersion();

        if (!currentSha) {
            await saveVersion(latestSha);
            return {
                available: false,
                mode: 'none',
                message: `📌 *Mara ya kwanza* — Toleo limehifadhiwa: \`${latestSha.slice(0,7)}\` (tawi: ${branch})\n\nHakuna update kwa sasa.`
            };
        }

        const isUpdateAvailable = (currentSha !== latestSha);
        let changedFiles = [];

        if (isUpdateAvailable) {
            const compareRes = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/compare/${currentSha}...${latestSha}`, {
                headers: { 'User-Agent': 'MickeyBot' }
            });
            changedFiles = compareRes.data.files.map(f => f.filename);
        }

        return {
            available: isUpdateAvailable,
            mode: 'git',
            files: changedFiles.join('\n'),
            version: latestSha,
            currentVersion: currentSha,
            latestSha,
            currentSha,
            branch
        };
    } catch (err) {
        console.error('Update check error:', err);
        return { available: false, mode: 'none', error: err.message };
    }
}

async function checkLocalChanges() {
    const currentHash = await computeLocalHash();
    const storedHash = await getStoredLocalHash();
    return { hasChanged: storedHash !== null && storedHash !== currentHash, currentHash, storedHash };
}

function formatUpdateInfo(res, localChanges) {
    if (res.message) return res.message;

    let output = '';
    if (localChanges.hasChanged) {
        output += `⚠️ *MABADILIKO YA NDANI YAMEGUNDULIKA!*\n`;
        output += `Umebadilisha faili za mfumo wako (local) ambazo hazipo kwenye GitHub.\n`;
        output += `Ikiwa unataka kuweka upya hali ya ndani, tumia: \`.checkupdates resetlocal\`\n\n`;
    }

    if (!res.available) {
        output += `✅ *Bot iko updated (remote)!*\nToleo la sasa: \`${res.currentSha?.slice(0,7) || 'unknown'}\`\nHakuna update mpya kutoka GitHub.`;
    } else {
        const compareUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/compare/${res.currentSha}...${res.latestSha}`;
        const filesCount = res.files ? res.files.split('\n').filter(Boolean).length : 0;
        output += `🔄 *UPDATE INAPATIKANA KUTOKA GITHUB!*\n\n` +
                  `Toleo lako: \`${res.currentSha.slice(0,7)}\`\n` +
                  `Toleo jipya: \`${res.latestSha.slice(0,7)}\`\n` +
                  `Mabadiliko: ${filesCount} faili zimebadilishwa\n\n` +
                  `📝 [Angalia mabadiliko](${compareUrl})\n\n` +
                  `💡 Baada ya kupakua update, tumia .checkupdates reset ili kusasisha toleo.`;
    }
    return output;
}

async function checkUpdatesCommand(sock, chatId, message, args = []) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

    if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(chatId, { text: 'Owner pekee ndiye anaweza kutumia .checkupdates' }, { quoted: message });
        return;
    }

    const reminder = await loadReminder();
    const cmd = (args[0] || '').toLowerCase();

    if (cmd === 'auto') {
        reminder.autoReminder = !reminder.autoReminder;
        await saveReminder();
        await sock.sendMessage(chatId, {
            text: `✅ Kumbusho la kiotomatiki ${reminder.autoReminder ? 'LIMEWASHWA' : 'IMEZIMWA'}`
        }, { quoted: message });
        return;
    }

    if (cmd === 'status') {
        const status = reminder.autoReminder ? '✅ LIMEWASHWA' : '❌ IMEZIMWA';
        await sock.sendMessage(chatId, {
            text: `📢 *Hali ya kumbusho:* ${status}\n\nTumia .checkupdates auto kugeuza.`
        }, { quoted: message });
        return;
    }

    if (cmd === 'reset') {
        try {
            const { sha, branch } = await getLatestCommit();
            await saveVersion(sha);
            await sock.sendMessage(chatId, {
                text: `✅ *Toleo limewekwa upya (remote)*\nToleo jipya: \`${sha.slice(0,7)}\` (tawi: ${branch})\nSasa unaweza kuangalia tena kwa .checkupdates`
            }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(chatId, { text: `❌ Imeshindwa kuweka upya: ${err.message}` }, { quoted: message });
        }
        return;
    }

    if (cmd === 'resetlocal') {
        try {
            const currentHash = await computeLocalHash();
            await saveLocalHash(currentHash);
            await sock.sendMessage(chatId, {
                text: `✅ *Hali ya ndani imewekwa upya*\nSasa bot itaona mabadiliko yako kama "halali".`
            }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(chatId, { text: `❌ Imeshindwa: ${err.message}` }, { quoted: message });
        }
        return;
    }

    try {
        const res = await checkForUpdates();
        const localChanges = await checkLocalChanges();

        if (!localChanges.storedHash) {
            await saveLocalHash(localChanges.currentHash);
        }

        const updateMsg = formatUpdateInfo(res, localChanges);
        await sock.sendMessage(chatId, { text: updateMsg }, { quoted: message });

        if (res.available && reminder.autoReminder) {
            const hash = res.files ? res.files.slice(0, 50) : '';
            if (hash !== reminder.updateHash) {
                reminder.updateHash = hash;
                reminder.updateFound = true;
                reminder.lastCheck = new Date().toISOString();
                await saveReminder();
                await sock.sendMessage(chatId, {
                    text: `🔔 *KUMBUKA:* Kuna update ya GitHub inasubiri. Tumia .checkupdates reset baada ya kupakua.`
                });
            }
        } else if (!res.available && !res.message) {
            reminder.updateFound = false;
            reminder.updateHash = null;
            await saveReminder();
        }
    } catch (err) {
        console.error('CheckUpdates failed:', err);
        await sock.sendMessage(chatId, {
            text: `❌ *Imeshindwa kuangalia updates*\n\nHitilafu: ${err.message || err}\n\nAngalia mtandao na ujaribu tena.`
        }, { quoted: message });
    }
}

module.exports = checkUpdatesCommand;