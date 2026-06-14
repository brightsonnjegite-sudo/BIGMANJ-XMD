const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');

// Load settings
let settings = {};
try {
    settings = require('./settings');
} catch (e) {
    console.log('⚠️ settings.js not found');
}
const OWNER_NUMBER = (settings.ownerNumber || '255777580820').toString().replace(/\D/g, '');
console.log(`✅ Owner number from settings: ${OWNER_NUMBER}`);

// Helper function to extract phone number from any JID (handles @s.whatsapp.net, @lid, etc.)
function extractPhoneNumber(jid) {
    if (!jid) return null;
    // Try to get digits from JID (if it contains a phone number)
    // Format could be 255777580820@s.whatsapp.net or 123456789012345@lid
    // Remove everything after '@'
    let localPart = jid.split('@')[0];
    // Check if localPart is all digits and starts with country code (1-4 digits)
    if (/^\d+$/.test(localPart) && localPart.length >= 10) {
        return localPart;
    }
    // If not, maybe the whole JID is needed? Return null for LID.
    return null;
}

async function cycleReactions(sock, messageKey, reactions, delayMs = 2000) {
    for (const emoji of reactions) {
        await sock.sendMessage(messageKey.remoteJid, { react: { text: emoji, key: messageKey } });
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
}

async function sendImageWithCopyButton(sock, chatId, imageUrl) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
        const imageBuffer = Buffer.from(response.data);
        const interactiveButtons = [
            {
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    display_text: '📋 MENU',
                    id: 'copy_menu_command',
                    copy_code: '.menu'
                })
            }
        ];
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: '🌟 *BIGMANJ BOT V3 IMPROVED* 🌟\n *and ready 🚀*\n\n© bigmanj tech ™ with ♥︎ 🤖',
            interactiveButtons: interactiveButtons
        });
        console.log(chalk.green('✅ Sent image with interactive copy button.'));
    } catch (error) {
        console.error(chalk.red('Failed to send image with button. Sending text fallback...'), error);
        const fallbackMsg = '______________________________\n🌟 *BIGMANJ BOT V3 IMPROVED* 🌟\n          *and ready 🚀*\n\n*© bigmanj tech ™ with ♥︎ 🤖*\n\n📋 Copy this command: `.menu`';
        await sock.sendMessage(chatId, { text: fallbackMsg });
    }
}

async function updateCommand(sock, chatId, message, customUrl = null) {
    try {
        // Get sender JID
        const senderId = message.key.participant || message.key.remoteJid;
        const senderNumber = extractPhoneNumber(senderId);
        
        // DEBUG: log to console
        console.log(chalk.yellow(`🔍 Sender JID: ${senderId}`));
        console.log(chalk.yellow(`🔍 Extracted number: ${senderNumber}`));
        console.log(chalk.yellow(`🔍 Owner number: ${OWNER_NUMBER}`));

        // Owner check: compare extracted number OR exact JID if extraction fails (for LID)
        let isOwner = false;
        if (senderNumber && senderNumber === OWNER_NUMBER) {
            isOwner = true;
        } else if (senderId === `${OWNER_NUMBER}@s.whatsapp.net`) {
            isOwner = true;
        } else if (senderId === OWNER_NUMBER) {
            isOwner = true;
        }
        
        // Also allow the bot's own number (message.key.fromMe) as a fallback
        if (message.key.fromMe) isOwner = true;

        if (!isOwner) {
            await sock.sendMessage(chatId, { text: "❌ *Samahani, ni owner pekee anayeruhusiwa kutumia hii command!*" });
            return;
        }

        const part1 = `🚀 *BIGMANJ BOT V3 UPDATE START.......* 🚀\n_______________________________\n*$ sudo bot update 🔄*\n *Fetching updates.......from BIGMANJ REPO 📡*\n *Downloading... [███████████████] 100% ✅*\n *Extracting... OK 📦*\n *Copying files... 14/14 📋*\n *Preserving data... Session, Stats, Users 🔐*`;
        const sentMsg1 = await sock.sendMessage(chatId, { text: part1 });
        cycleReactions(sock, sentMsg1, ['🔄', '♻️'], 2000).catch(console.error);

        const mainRepo = 'https://github.com/brightsonnjegite-sudo/BIGMANJ-BOT-V3';
        let updateZipUrl;
        if (customUrl && customUrl.startsWith('http')) {
            updateZipUrl = customUrl.trim();
        } else if (customUrl === 'branch' && customUrl.split(' ')[1]) {
            const branch = customUrl.split(' ')[1] || 'main';
            updateZipUrl = `${mainRepo}/archive/refs/heads/${branch}.zip`;
        } else {
            updateZipUrl = `${mainRepo}/archive/refs/heads/main.zip`;
        }

        console.log(chalk.blue(`[BIGMANJ Update] Downloading from: ${updateZipUrl}`));

        const tmpDir = path.join(process.cwd(), 'temp_update');
        const zipPath = path.join(tmpDir, 'bigmanj_update.zip');
        const extractPath = path.join(tmpDir, 'extracted');

        if (fs.existsSync(tmpDir)) fs.removeSync(tmpDir);
        fs.ensureDirSync(tmpDir);

        const response = await axios({
            method: 'get',
            url: updateZipUrl,
            responseType: 'stream',
            timeout: 90000,
            headers: { 'User-Agent': 'BIGMANJ-Bot/3.0' }
        }).catch(err => { throw new Error(`Download failed: ${err.message}`); });

        const writer = fs.createWriteStream(zipPath);
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        exec(`unzip -o ${zipPath} -d ${extractPath}`, async (err, stdout, stderr) => {
            if (err) {
                console.log(chalk.red("Extraction failed:"), stderr);
                await sock.sendMessage(chatId, { text: "*⚠️ Trying alternative extraction method...*" });
                const AdmZip = require('adm-zip');
                try {
                    const zip = new AdmZip(zipPath);
                    zip.extractAllTo(extractPath, true);
                } catch (zipErr) {
                    await sock.sendMessage(chatId, { text: "❌ *Extraction Failed:* Hakikisha unzip ipo kwenye system.\nJaribu: `apt install unzip -y`" });
                    fs.removeSync(tmpDir);
                    return;
                }
            }

            try {
                const folders = fs.readdirSync(extractPath);
                if (folders.length === 0) throw new Error("No files extracted");
                let rootFolder = path.join(extractPath, folders[0]);
                while (fs.readdirSync(rootFolder).length === 1 && 
                       fs.statSync(path.join(rootFolder, fs.readdirSync(rootFolder)[0])).isDirectory()) {
                    rootFolder = path.join(rootFolder, fs.readdirSync(rootFolder)[0]);
                }

                const protectedItems = [
                    'node_modules', 'session', 'auth_info_baileys', 'sessions', '.git', '.env',
                    'config.js', 'settings.json', 'database.json', 'data/chatbot.json',
                    'data/chatbot_memory.json', 'data/user_prefs.json', 'data/stats.json',
                    'data/custom_responses.json', 'data/reminders.json'
                ];

                const files = fs.readdirSync(rootFolder);
                let copiedCount = 0, skippedCount = 0;

                for (const file of files) {
                    const shouldProtect = protectedItems.some(protected => 
                        file === protected || file.startsWith(protected + '/')
                    );
                    if (!shouldProtect && file !== 'BIGMANJ-XMD-main') {
                        const source = path.join(rootFolder, file);
                        const dest = path.join(process.cwd(), file);
                        if (fs.existsSync(source)) {
                            fs.copySync(source, dest, { overwrite: true });
                            copiedCount++;
                        }
                    } else {
                        skippedCount++;
                    }
                }

                const newPackagePath = path.join(rootFolder, 'package.json');
                const currentPackagePath = path.join(process.cwd(), 'package.json');
                if (fs.existsSync(newPackagePath)) {
                    const newPackage = require(newPackagePath);
                    const currentPackage = require(currentPackagePath);
                    if (newPackage.scripts && !currentPackage.scripts) {
                        currentPackage.scripts = newPackage.scripts;
                        fs.writeFileSync(currentPackagePath, JSON.stringify(currentPackage, null, 2));
                    }
                }

                fs.removeSync(tmpDir);

                const part2 = `_______________________________\n✅ *Update successful.* 🎉\n\n*$ bot restart --in 5s ⏳*\n\n*🔄 Bot in progress...*`;
                const sentMsg2 = await sock.sendMessage(chatId, { text: part2 });
                cycleReactions(sock, sentMsg2, ['📡', '⌛', '⏳', '✅'], 2000).catch(console.error);

                console.log(chalk.green.bold('✅ BIGMANJ BOT V3 UPDATE SUCCESSFUL!'));
                console.log(chalk.yellow(`📁 ${copiedCount} files updated, ${skippedCount} files protected`));

                const flagFile = path.join(process.cwd(), 'data', 'update_just_done.flag');
                fs.ensureDirSync(path.dirname(flagFile));
                fs.writeFileSync(flagFile, JSON.stringify({
                    timestamp: Date.now(),
                    chatId: chatId
                }));

                setTimeout(() => {
                    console.log(chalk.yellow('🔄 Restarting BIGMANJ Bot...'));
                    process.exit(0);
                }, 5000);

            } catch (copyErr) {
                console.error(chalk.red("Copy error:"), copyErr);
                await sock.sendMessage(chatId, { text: `❌ *Update Failed:* ${copyErr.message}\n\nTafadhali wasiliana na mwenye bot.` });
                fs.removeSync(tmpDir);
            }
        });

    } catch (err) {
        console.error(chalk.red("Update Error:"), err.message);
        await sock.sendMessage(chatId, { text: `❌ *Update Imefeli:* ${err.message}\n\n• Repo iko private au haipatikani\n• Connection timeout\n• Hakuna unzip kwenye server\n\nJaribu tena baadaye.` }).catch(() => {});
    }
}

async function checkVersion(sock, chatId, message) {
    try {
        const packageJson = require(path.join(process.cwd(), 'package.json'));
        const currentVersion = packageJson.version || '3.0.0';
        try {
            const apiUrl = 'https://api.github.com/repos/brightsonnjegite-sudo/BIGMANJ-XMD/commits/main';
            const response = await axios.get(apiUrl, { timeout: 5000 });
            const latestCommit = response.data;
            const lastUpdate = new Date(latestCommit.commit.author.date).toLocaleString();
            const versionMsg = `🤖 *BIGMANJ BOT V3*\n\n📌 *Current Version:* ${currentVersion}\n📦 *Repository:* BIGMANJ-XMD\n🕐 *Latest Update:* ${lastUpdate}\n📝 *Latest Commit:* ${latestCommit.commit.message.slice(0, 50)}...\n\n💡 *Commands:*\n├ .update - Update to latest version\n├ .update branch [name] - Update from specific branch\n├ .version - Check status\n└ .update [url] - Custom URL\n\n✅ *Bot iko running smoothly!* 🚀`;
            await sock.sendMessage(chatId, { text: versionMsg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: `🤖 *BIGMANJ BOT V3*\n📌 Version: ${currentVersion}\n⚠️ Unable to check remote updates` });
        }
    } catch (err) {
        console.error("Version check error:", err);
    }
}

module.exports = { updateCommand, checkVersion };