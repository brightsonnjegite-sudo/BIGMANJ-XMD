const isOwnerOrSudo = require('../lib/isOwner');
const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');

// Configuration
const REMINDER_FILE = path.join(__dirname, '../data/updateReminder.json');
const VERSION_FILE = path.join(__dirname, '../data/currentVersion.json');
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

// Helper: get latest commit SHA from GitHub (default branch)
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

// Helper: get stored version
async function getStoredVersion() {
    try {
        const data = await fs.readFile(VERSION_FILE, 'utf8');
        return JSON.parse(data).sha;
    } catch {
        return null;
    }
}

// Helper: save version
async function saveVersion(sha) {
    await fs.mkdir(path.dirname(VERSION_FILE), { recursive: true });
    await fs.writeFile(VERSION_FILE, JSON.stringify({ sha, updatedAt: new Date().toISOString() }, null, 2));
}

// Main check logic (with auto-initialize)
async function checkForUpdates() {
    try {
        const { sha: latestSha, branch } = await getLatestCommit();
        let currentSha = await getStoredVersion();

        // FIRST RUN: no stored version → save latest as current
        if (!currentSha) {
            await saveVersion(latestSha);
            return {
                available: false,
                mode: 'none',
                message: `📌 *First time setup* — Current version saved: \`${latestSha.slice(0,7)}\` (branch: ${branch})\n\nNo updates available yet.`
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

// Format update message (simplified but clear)
function formatUpdateInfo(res) {
    if (res.message) return res.message; // first run message

    if (!res.available) {
        return `✅ *Bot iko updated!*\nToleo la sasa: \`${res.currentSha?.slice(0,7) || 'unknown'}\`\nHakuna update mpya.`;
    }

    const compareUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/compare/${res.currentSha}...${res.latestSha}`;
    const filesCount = res.files ? res.files.split('\n').filter(Boolean).length : 0;

    return `🔄 *UPDATE INAPATIKANA!*\n\n` +
           `Toleo lako: \`${res.currentSha.slice(0,7)}\`\n` +
           `Toleo jipya: \`${res.latestSha.slice(0,7)}\`\n` +
           `Mabadiliko: ${filesCount} faili zimebadilishwa\n\n` +
           `📝 [Angalia mabadiliko](${compareUrl})\n\n` +
           `💡 Ikiwa umeanza kutumia bot, hakikisha umepakua mabadiliko. Unaweza kutumia \`.update\` (kama ipo) au kupakua mwenyewe.`;
}

// Main command function
async function checkUpdatesCommand(sock, chatId, message, args = []) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

    if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(chatId, { text: 'Only bot owner or sudo can use .checkupdates' }, { quoted: message });
        return;
    }

    const reminder = await loadReminder();
    const cmd = (args[0] || '').toLowerCase();

    // Auto reminder toggle
    if (cmd === 'auto') {
        reminder.autoReminder = !reminder.autoReminder;
        await saveReminder();
        await sock.sendMessage(chatId, {
            text: `✅ Auto update reminders ${reminder.autoReminder ? 'ENABLED' : 'DISABLED'}`
        }, { quoted: message });
        return;
    }

    // Reminder status
    if (cmd === 'status') {
        const status = reminder.autoReminder ? '✅ ENABLED' : '❌ DISABLED';
        await sock.sendMessage(chatId, {
            text: `📢 *Update Reminder Status:* ${status}\n\n💡 Use .checkupdates auto to toggle`
        }, { quoted: message });
        return;
    }

    // RESET command: force stored version to latest remote (use after manual update)
    if (cmd === 'reset') {
        try {
            const { sha, branch } = await getLatestCommit();
            await saveVersion(sha);
            await sock.sendMessage(chatId, {
                text: `✅ *Version reset successful*\nToleo limewekwa upya: \`${sha.slice(0,7)}\` (branch: ${branch})\n\nSasa unaweza kuangalia updates tena kwa .checkupdates`
            }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: `❌ Reset failed: ${err.message}`
            }, { quoted: message });
        }
        return;
    }

    // Normal update check
    try {
        const res = await checkForUpdates();
        const updateMsg = formatUpdateInfo(res);
        await sock.sendMessage(chatId, { text: updateMsg }, { quoted: message });

        // Auto reminder logic
        if (res.available && reminder.autoReminder) {
            const hash = res.files ? res.files.slice(0, 50) : '';
            if (hash !== reminder.updateHash) {
                reminder.updateHash = hash;
                reminder.updateFound = true;
                reminder.lastCheck = new Date().toISOString();
                await saveReminder();
                // Optional: send extra reminder
                await sock.sendMessage(chatId, {
                    text: `🔔 *KUMBUKA:* Kuna update inasubiri. Tumia .update kupata mabadiliko (kama command ipo).`
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
            text: `❌ *Update Check Failed*\n\nError: ${err.message || err}\n\n💡 Hakikisha mtandao uko sawa na ujaribu tena.`
        }, { quoted: message });
    }
}

module.exports = checkUpdatesCommand;