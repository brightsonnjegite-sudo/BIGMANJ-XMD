const fetch = require('node-fetch');

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        await sock.sendMessage(chatId, {
            text: '🔍 *Tafadhali andika jina la wimbo*\nMfano: .lyric Mwamba Mbosso'
        }, { quoted: message });
        return;
    }

    // 🔄 Onyesha reaction ya "🔍" kwenye ujumbe wa mtumiaji (kuonesha inatafuta)
    await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } }).catch(() => {});

    // ✍️ Onyesha kuwa bot inaandika (composing)
    await sock.sendPresenceUpdate('composing', chatId).catch(() => {});

    try {
        // API ya PopCat.xyz (huru, hakuna API key required)
        const apiUrl = `https://api.popcat.xyz/lyrics?song=${encodeURIComponent(songTitle)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Kama hakuna matokeo au kuna kosa
        if (!data || data.error || !data.lyrics) {
            // Badilisha reaction kuwa ❌
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }).catch(() => {});
            await sock.sendMessage(chatId, {
                text: `❌ *Nyimbo "${songTitle}" haikupatikana.*\n💡 Jaribu kuandika jina kamili la wimbo na msanii, mfano:\n.lyric Mwamba Mbosso\n.lyric Eminem Rap God`
            }, { quoted: message });
            return;
        }

        // Pata jina la wimbo na msanii
        const title = data.title || songTitle;
        const artist = data.artist || 'Msanii asiyejulikana';
        let lyrics = data.lyrics;

        // Kata ikiwa nyimbo ni ndefu (WhatsApp inaruhusu ~4096 herufi)
        const MAX_LENGTH = 4000;
        if (lyrics.length > MAX_LENGTH) {
            lyrics = lyrics.slice(0, MAX_LENGTH - 50) + '\n\n... (nyimbo imekatwa kwa sababu ni ndefu sana)';
        }

        const result = `🎵 *${title}* - ${artist}\n\n${lyrics}`;
        
        // Badilisha reaction kuwa ✅ (imefaulu)
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } }).catch(() => {});
        
        // Tuma nyimbo
        await sock.sendMessage(chatId, { text: result }, { quoted: message });

    } catch (error) {
        console.error('❌ Hitilafu ya kutafuta nyimbo:', error);
        // Reaction ya ❌ kwa kosa
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } }).catch(() => {});
        await sock.sendMessage(chatId, {
            text: '❌ *Imeshindwa kutafuta nyimbo.* Jaribu tena baadaye. (API inaweza kuwa na shida)'
        }, { quoted: message });
    }
}

module.exports = { lyricsCommand };