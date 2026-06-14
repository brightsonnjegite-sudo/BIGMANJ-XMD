const { isJidGroup } = require('@whiskeysockets/baileys');
const { getAntilink, incrementWarningCount, resetWarningCount, isSudo } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');
const config = require('../config');

const WARN_COUNT = config.WARN_COUNT || 3;
const FOOTER = '© bigmanj tech ™ with ♥︎';
const ADMIN_REQUIRED_MSG = 'Be an admin 😁 first 🥇 then antilink as security will perfect run to deal 🤝 with all links in groups send by not admin users!';

function containsURL(str) {
    const urlRegex = /(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?/i;
    return urlRegex.test(str);
}

async function Antilink(msg, sock) {
    const jid = msg.key.remoteJid;
    if (!isJidGroup(jid)) return;

    const SenderMessage = msg.message?.conversation || 
                          msg.message?.extendedTextMessage?.text || '';
    if (!SenderMessage || typeof SenderMessage !== 'string') return;

    const sender = msg.key.participant;
    if (!sender) return;
    
    try {
        const { isSenderAdmin } = await isAdmin(sock, jid, sender);
        if (isSenderAdmin) return;
    } catch (_) {}
    const senderIsSudo = await isSudo(sender);
    if (senderIsSudo) return;

    if (!containsURL(SenderMessage.trim())) return;
    
    const antilinkConfig = await getAntilink(jid, 'on');
    if (!antilinkConfig) return;

    const action = antilinkConfig.action || 'delete';
    const mention = sender.split('@')[0];
    
    try {
        await sock.sendMessage(jid, { delete: msg.key });

        if (action === 'delete') {
            return;
        }
        else if (action === 'warn') {
            const warningCount = await incrementWarningCount(jid, sender);
            if (warningCount >= WARN_COUNT) {
                const kickMsg = `💀 *YOU HAVE BEEN REMOVED* 💀\n\n` +
                    `@${mention} you ignored ${WARN_COUNT} warnings and kept posting links.\n\n` +
                    `😈 *Bigmanj Antilink* does not tolerate rule breaking.\n\n` +
                    `You are now EXPELLED from this group.\n\n` +
                    FOOTER;
                await sock.sendMessage(jid, { text: kickMsg, mentions: [sender] });
                await resetWarningCount(jid, sender);
                try {
                    await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                } catch (err) {
                    await sock.sendMessage(jid, { text: ADMIN_REQUIRED_MSG + '\n' + FOOTER });
                }
            } else {
                const warnMsg = `🚫 *🔥 ANTILINK WARNING ${warningCount}/${WARN_COUNT} 🔥*\n\n` +
                    `@${mention} you have posted a forbidden link!\n\n` +
                    `😨 *This is warning ${warningCount} of ${WARN_COUNT}.* Next violation will get you REMOVED.\n\n` +
                    `*Bigmanj Security System* – ACTIVE and FEARFUL 🔪\n` +
                    FOOTER;
                await sock.sendMessage(jid, { text: warnMsg, mentions: [sender] });
            }
        }
        else if (action === 'remove') {
            const kickMsg = `💀 *YOU HAVE BEEN REMOVED* 💀\n\n` +
                `@${mention} you posted a forbidden link.\n\n` +
                `😈 *Bigmanj Antilink* does not tolerate rule breaking.\n\n` +
                `You are now EXPELLED from this group.\n\n` +
                FOOTER;
            await sock.sendMessage(jid, { text: kickMsg, mentions: [sender] });
            try {
                await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                await resetWarningCount(jid, sender);
            } catch (err) {
                await sock.sendMessage(jid, { text: ADMIN_REQUIRED_MSG + '\n' + FOOTER });
            }
        }
    } catch (error) {
        console.error('Error in Antilink:', error);
    }
}

module.exports = { Antilink };