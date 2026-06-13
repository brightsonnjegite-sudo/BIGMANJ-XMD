const axios = require('axios');
const moment = require('moment-timezone');

const getMentionNumber = (jid) => jid.split('@')[0];
const getGreeting = () => {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
};

// Helper: parse "Artist - Title" or "Title by Artist"
function parseQuery(query) {
    if (query.includes(' - ')) {
        const parts = query.split(' - ');
        return { artist: parts[0].trim(), title: parts[1].trim() };
    }
    if (query.toLowerCase().includes(' by ')) {
        const parts = query.split(/ by /i);
        return { artist: parts[1].trim(), title: parts[0].trim() };
    }
    return { artist: null, title: query };
}

// 1. Nexray API (primary)
async function fetchFromNexray(query) {
    const url = `https://api.nexray.eu.cc/search/lyrics?q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;
    if (data?.status === true && data.result?.lyrics?.plain_lyrics) {
        return {
            title: data.result.lyrics.track_name || data.result.title,
            artist: data.result.lyrics.artist_name || data.result.artist,
            lyrics: data.result.lyrics.plain_lyrics,
            source: 'Nexray'
        };
    }
    throw new Error('Nexray no lyrics');
}

// 2. SomeRandomAPI (secondary)
async function fetchFromSomeRandom(query) {
    const url = `https://some-random-api.com/lyrics?title=${encodeURIComponent(query)}`;
    const res = await axios.get(url, { timeout: 10000 });
    if (res.data?.lyrics) {
        return {
            title: res.data.title,
            artist: res.data.author,
            lyrics: res.data.lyrics,
            source: 'SomeRandomAPI'
        };
    }
    throw new Error('SomeRandom no lyrics');
}

// 3. Lyrics.ovh (needs artist & title)
async function fetchFromLyricsOvh(artist, title) {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const res = await axios.get(url, { timeout: 10000 });
    if (res.data?.lyrics) {
        return {
            title: title,
            artist: artist,
            lyrics: res.data.lyrics,
            source: 'lyrics.ovh'
        };
    }
    throw new Error('Lyrics.ovh no lyrics');
}

// 4. Lyrist API (last fallback)
async function fetchFromLyrist(query) {
    const url = `https://lyrist.vercel.app/api/lyrics?q=${encodeURIComponent(query)}`;
    const res = await axios.get(url, { timeout: 10000 });
    if (res.data?.lyrics) {
        return {
            title: res.data.title || query,
            artist: res.data.artist || 'Unknown',
            lyrics: res.data.lyrics,
            source: 'Lyrist'
        };
    }
    throw new Error('Lyrist no lyrics');
}

// Main command
const lyricsCommand = async (sock, chatId, message, args) => {
    try {
        let query = (args || '').trim();
        if (!query) {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quoted && (quoted.conversation || quoted.extendedTextMessage?.text)) {
                query = (quoted.conversation || quoted.extendedTextMessage?.text || '').trim();
            }
            if (!query) {
                await sock.sendMessage(chatId, {
                    text: '❌ *Usage:* .lyrics <song title>\nExample: .lyrics Bado Nakupenda Zuchu'
                }, { quoted: message });
                return;
            }
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        let result = null;
        let { artist, title } = parseQuery(query);

        // Try Nexray first
        try {
            result = await fetchFromNexray(query);
        } catch (e) {
            console.log(`Nexray failed: ${e.message}`);
            // Try SomeRandom
            try {
                result = await fetchFromSomeRandom(query);
            } catch (e2) {
                console.log(`SomeRandom failed: ${e2.message}`);
                // Try lyrics.ovh if we have artist & title
                if (artist && title) {
                    try {
                        result = await fetchFromLyricsOvh(artist, title);
                    } catch (e3) {}
                }
                // Last fallback: Lyrist
                if (!result) {
                    try {
                        result = await fetchFromLyrist(query);
                    } catch (e4) {
                        console.log(`Lyrist failed: ${e4.message}`);
                    }
                }
            }
        }

        if (!result) {
            throw new Error(`No lyrics found for "${query}". Try a different song title or format "Artist - Title".`);
        }

        const senderId = message.key.participant || message.key.remoteJid;
        const mention = getMentionNumber(senderId);
        const greeting = getGreeting();

        let caption = `${greeting} @${mention}\n\n`;
        caption += `🎵 *LYRICS*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        caption += `*Title:* ${result.title}\n`;
        caption += `*Artist:* ${result.artist}\n\n`;
        caption += `*Lyrics:*\n${result.lyrics}\n\n`;
        caption += `🚀 *BIGMANJ BOT V3* — Fast • Powerful • Reliable\n`;
        caption += `© bigmanj tech ™ with ♥︎\n`;
        caption += `_📡 via ${result.source}_`;

        if (caption.length > 60000) {
            await sock.sendMessage(chatId, { text: '❌ Lyrics too long to send.' }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        await sock.sendMessage(chatId, { text: caption, mentions: [senderId] }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Lyrics error:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        let errorMsg = error.message || '❌ *Lyrics not found.*\nTry a different song title.';
        if (error.message.includes('timeout')) errorMsg = '⏰ Request timeout. Try again.';
        if (error.message.includes('network')) errorMsg = '🌐 Network error. Try later.';
        await sock.sendMessage(chatId, { text: errorMsg }, { quoted: message });
    }
};

module.exports = lyricsCommand;