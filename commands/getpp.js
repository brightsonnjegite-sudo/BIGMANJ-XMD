const axios = require('axios');
const fs = require('fs');

/**
 * @param {Object} sock - Baileys socket instance
 * @param {Object} m - Message object
 * @param {Array} args - Arguments (namba ya mlengwa)
 */
const getProfilePictureCommand = async (sock, m, args) => {
    try {
        const sender = m.key.remoteJid;
        
        // 1. Tambua namba ya mlengwa (Identify target number)
        // Kama amemention mtu, au ameweka namba kwenye args, au anajichukulia mwenyewe
        let target;
        if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        } else {
            target = sender;
        }

        await sock.sendMessage(sender, { text: 'Inapata picha... (Fetching PP...)' }, { quoted: m });

        // 2. Pata URL ya picha (Get PP URL)
        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(target, 'image');
        } catch (e) {
            // Kama hana picha au privacy imefungwa
            return await sock.sendMessage(sender, { text: 'Picha haikupatikana (PP not found/private).' }, { quoted: m });
        }

        // 3. Download picha kwa kutumia Axios
        const response = await axios({
            url: ppUrl,
            method: 'GET',
            responseType: 'arraybuffer'
        });

        // 4. Tuma picha kwa user (Send image back)
        await sock.sendMessage(sender, { 
            image: Buffer.from(response.data), 
            caption: `Hii hapa PP ya @${target.split('@')[0]}`,
            mentions: [target]
        }, { quoted: m });

    } catch (err) {
        console.error('Error kwenye getpp:', err);
        await sock.sendMessage(m.key.remoteJid, { text: 'Hitilafu imetokea! (Error occurred!)' });
    }
};

module.exports = getProfilePictureCommand;
