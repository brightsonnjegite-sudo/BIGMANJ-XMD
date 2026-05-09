const { delay } = require('@whiskeysockets/baileys');

/**
 * Command rahisi ya kupata profile picture
 */
async function getProfilePictureCommand(sock, chatId, msg) {
  try {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const args = text.split(' ');

    let targetJid;

    if (ctx?.mentionedJid?.length > 0) {
      targetJid = ctx.mentionedJid[0];
    } else if (args[1] && args[1].match(/^\d+$/)) {
      targetJid = `${args[1]}@s.whatsapp.net`;
    } else {
      targetJid = msg.key.participant || msg.key.remoteJid;
    }

    // Jaribu kupata profile picture
    let ppUrl;
    try {
      ppUrl = await sock.profilePictureUrl(targetJid, 'image');
    } catch {
      try {
        ppUrl = await sock.profilePictureUrl(targetJid, 'preview');
      } catch {
        ppUrl = null;
      }
    }

    if (!ppUrl) {
      ppUrl = "https://ui-avatars.com/api/?name=No+DP&background=random&size=512";
    }

    await sock.sendMessage(chatId, {
      image: { url: ppUrl },
      caption: `👤 @${targetJid.split('@')[0]}`,
      mentions: [targetJid]
    }, { quoted: msg });

    await delay(1000);

  } catch (err) {
    console.error("Error fetching PP:", err);
    await sock.sendMessage(chatId, { text: "❌ Imeshindikana kupata profile picture." });
  }
}

module.exports = getProfilePictureCommand;