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

function formatUpdateInfo(res) {
    if (res.message) return res.message;

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
           `💡 Baada ya kupakua update, tumia .checkupdates reset ili kusasisha toleo.`;
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
                text: `✅ *Toleo limewekwa upya*\nToleo jipya: \`${sha.slice(0,7)}\` (tawi: ${branch})\nSasa unaweza kuangalia tena kwa .checkupdates`
            }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(chatId, { text: `❌ Imeshindwa kuweka upya: ${err.message}` }, { quoted: message });
        }
        return;
    }

    try {
        const res = await checkForUpdates();
        const updateMsg = formatUpdateInfo(res);
        await sock.sendMessage(chatId, { text: updateMsg }, { quoted: message });

        if (res.available && reminder.autoReminder) {
            const hash = res.files ? res.files.slice(0, 50) : '';
            if (hash !== reminder.updateHash) {
                reminder.updateHash = hash;
                reminder.updateFound = true;
                reminder.lastCheck = new Date().toISOString();
                await saveReminder();
                await sock.sendMessage(chatId, {
                    text: `🔔 *KUMBUKA:* Kuna update inasubiri. Tumia .checkupdates reset baada ya kupakua.`
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