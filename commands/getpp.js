async function getProfilePictureCommand(sock, chatId, msg) {
  try {
    let targetJid = null;

    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    if (ctx?.mentionedJid && ctx.mentionedJid.length > 0) {
      targetJid = ctx.mentionedJid[0];
    } else if (ctx?.participant) {
      targetJid = ctx.participant;
    } else {
      targetJid = msg.key.participant || msg.key.remoteJid;
    }

    if (!targetJid) {
      await sock.sendMessage(chatId, { text: '⚠️ Please reply to a user or mention someone to get their profile picture.' }, { quoted: msg });
      return;
    }

    let ppUrl;
    try {
      // Tunajaribu kupata picha ya wasifu
      ppUrl = await sock.profilePictureUrl(targetJid, 'image');
    } catch (e) {
      // Ikishindikana (Privacy/No PP), tunatumia picha ya default
      ppUrl = 'https://telegra.ph/file/0309995815610897f90e3.jpg'; 
    }

    // FIX: Hakikisha ppUrl siyo undefined kabla ya kutuma
    if (!ppUrl || ppUrl === undefined) {
      ppUrl = 'https://telegra.ph/file/0309995815610897f90e3.jpg';
    }

    const caption = `📷 Profile picture of @${targetJid.split('@')[0]}`;

    await sock.sendMessage(chatId, {
      image: { url: ppUrl }, // Sasa ni lazima iwe na URL halali
      caption: caption,
      mentions: [targetJid]
    }, { quoted: msg });

  } catch (error) {
    // Hii inazuia bot ku-crash kabisa hata kukiwa na error ya Baileys
    console.error('Error in getpp command:', error.message);
    try { 
      await sock.sendMessage(chatId, { text: '❌ Picha ya wasifu haikupatikana (Privacy Settings).' }, { quoted: msg }); 
    } catch (e) {}
  }
}

module.exports = getProfilePictureCommand;
