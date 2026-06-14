const isOwnerOrSudo = require('../lib/isOwner');
const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

// Configuration
const REMINDER_FILE = path.join(__dirname, '../data/updateReminder.json');
const VERSION_FILE = path.join(__dirname, '../data/currentVersion.json');
const LOCAL_HASH_FILE = path.join(__dirname, '../data/localHash.json');
const LOCAL_MANIFEST_FILE = path.join(__dirname, '../data/localManifest.json');
const REPO_OWNER = 'brightsonnjegite-sudo';
const REPO_NAME = 'BIGMANJ-BOT-V3';

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

// Get list of important files (fast, no content read)
async function getImportantFiles() {
    const rootDir = path.join(__dirname, '..');
    const ignoreDirs = ['node_modules', 'data', 'auth_info', '.git', 'tmp', 'logs'];
    const ignoreFiles = ['.env', '.DS_Store', 'package-lock.json'];
    const includeExtensions = ['.js', '.json', '.md', '.txt', '.example', '.yml', '.yaml'];
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
    files.sort();
    return files;
}

// Check if any file has changed using mtime & size (very fast)
async function hasLocalFileChanges() {
    const files = await getImportantFiles();
    let manifest = {};
    try {
        const data = await fs.readFile(LOCAL_MANIFEST_FILE, 'utf8');
        manifest = JSON.parse(data);
    } catch {
        // no manifest, assume changes (first run)
        return true;
    }

    for (const file of files) {
        try {
            const stat = await fs.stat(file);
            const key = file;
            const stored = manifest[key];
            if (!stored || stored.mtime !== stat.mtimeMs || stored.size !== stat.size) {
                return true; // changed
            }
        } catch {
            return true; // file missing or error
        }
    }
    return false;
}

// Update manifest with current file stats
async function updateManifest() {
    const files = await getImportantFiles();
    const manifest = {};
    for (const file of files) {
        try {
            const stat = await fs.stat(file);
            manifest[file] = { mtime: stat.mtimeMs, size: stat.size };
        } catch (err) {
            // ignore
        }
    }
    await fs.mkdir(path.dirname(LOCAL_MANIFEST_FILE), { recursive: true });
    await fs.writeFile(LOCAL_MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

// Compute full hash (only called when changes detected)
async function computeFullHash() {
    const files = await getImportantFiles();
    const hash = crypto.createHash('sha256');
    for (const file of files) {
        try {
            const content = await fs.readFile(file);
            hash.update(file);
            hash.update(content);
        } catch (err) {
            // skip
        }
    }
    return hash.digest('hex');
}

// Get stored local hash
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

// Fast local changes check (uses manifest first)
async function checkLocalChangesFast() {
    const hasChanges = await hasLocalFileChanges();
    if (!hasChanges) {
        const storedHash = await getStoredLocalHash();
        return { hasChanged: false, currentHash: storedHash, storedHash };
    }
    // Recompute hash because changes detected
    const currentHash = await computeFullHash();
    const storedHash = await getStoredLocalHash();
    const changed = storedHash !== null && storedHash !== currentHash;
    // Update manifest after recompute
    await updateManifest();
    return { hasChanged: changed, currentHash, storedHash };
}

async function getLatestCommit() {
    const repoInfo = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
        headers: { 'User-Agent': 'MickeyBot' },
        timeout: 5000
    });
    const defaultBranch = repoInfo.data.default_branch;
    const commitRes = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${defaultBranch}`, {
        headers: { 'User-Agent': 'MickeyBot' },
        timeout: 5000
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
                headers: { 'User-Agent': 'MickeyBot' },
                timeout: 5000
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

function formatUpdateInfo(res, localChanges) {
    if (res.message) return res.message;

    let output = '';
    if (localChanges.hasChanged) {
        output += `⚠️ *MABADILIKO YA NDANI YAMEGUNDULIKA!*\n`;
        output += `Umebadilisha faili za mfumo wako (local).\n`;
        output += `Tumia: \`.checkupdates resetlocal\` baada ya kuhakiki.\n\n`;
    }

    if (!res.available) {
        output += `✅ *Bot iko updated (remote)!*\nToleo: \`${res.currentSha?.slice(0,7) || 'unknown'}\``;
    } else {
        const compareUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/compare/${res.currentSha}...${res.latestSha}`;
        const filesCount = res.files ? res.files.split('\n').filter(Boolean).length : 0;
        output += `🔄 *UPDATE INAPATIKANA KUTOKA GITHUB!*\n\n` +
                  `Toleo lako: \`${res.currentSha.slice(0,7)}\`\n` +
                  `Toleo jipya: \`${res.latestSha.slice(0,7)}\`\n` +
                  `Mabadiliko: ${filesCount} faili\n\n` +
                  `📝 [Angalia](${compareUrl})\n\n` +
                  `💡 Baada ya kupakua, tumia .checkupdates reset`;
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
                text: `✅ *Toleo limewekwa upya (remote)*\nToleo jipya: \`${sha.slice(0,7)}\` (tawi: ${branch})`
            }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(chatId, { text: `❌ Imeshindwa kuweka upya: ${err.message}` }, { quoted: message });
        }
        return;
    }

    if (cmd === 'resetlocal') {
        try {
            // Force recompute hash and update manifest
            const currentHash = await computeFullHash();
            await saveLocalHash(currentHash);
            await updateManifest();
            await sock.sendMessage(chatId, {
                text: `✅ *Hali ya ndani imewekwa upya*`
            }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(chatId, { text: `❌ Imeshindwa: ${err.message}` }, { quoted: message });
        }
        return;
    }

    try {
        // Run remote check and local check in parallel for speed
        const [res, localChanges] = await Promise.all([
            checkForUpdates(),
            checkLocalChangesFast()
        ]);

        // First run: store local hash if not exists
        if (!localChanges.storedHash && localChanges.currentHash) {
            await saveLocalHash(localChanges.currentHash);
            await updateManifest();
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
                    text: `🔔 *KUMBUKA:* Kuna update ya GitHub. Tumia .checkupdates reset baada ya kupakua.`
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
            text: `❌ *Imeshindwa kuangalia updates*\n\nHitilafu: ${err.message || err}`
        }, { quoted: message });
    }
}

module.exports = checkUpdatesCommand;