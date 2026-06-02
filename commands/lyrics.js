const axios = require('axios');
const moment = require('moment-timezone');

const getMentionNumber = (jid) => jid.split('@')[0];
const getGreeting = () => {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
};

// Parse query: try to split into artist and title
function parseQuery(query) {
    // Check for " - " separator
    if (query.includes(' - ')) {
        const parts = query.split(' - ');
        return { artist: parts[0].trim(), title: parts[1].trim() };
    }
    // Check for "by" separator
    if (query.toLowerCase().includes(' by ')) {
        const parts = query.split(/ by /i);
        return { artist: parts[1].trim(), title: parts[0].trim() };
    }
    // Default: treat whole query as title, artist unknown
    return { artist: null, title: query };
}

// API 1: lyrics.ovh (needs artist and title)
async function fetchLyricsOvh(artist, title) {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const response = await axios.get(url, { timeout: 10000 });
    if (response.data && response.data.lyrics) {
        return {
            title: title,
            artist: artist,
            lyrics: response.data.lyrics,
            source: 'lyrics.ovh'
        };
    }
    throw new Error('Not found');
}

// API 2: Some Random API (fallback)
async function fetchLyricsSomeRandom(query) {
    const url = `https://some-random-api.com/lyrics?title=${encodeURIComponent(query)}`;
    const response = await axios.get(url, { timeout: 10000 });
    if (response.data && response.data.lyrics) {
        return {
            title: response.data.title,
            artist: response.data.author,
            lyrics: response.data.lyrics,
            source: 'some-random-api'
        };
    }
    throw new Error('Not found');
}

// API 3: Lyrist (last fallback)
async function fetchLyricsLyrist(query) {
    const url = `https://lyrist.vercel.app/api/lyrics?q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, { timeout: 10000 });
    if (response.data && response.data.lyrics) {
        return {
            title: response.data.title || query,
            artist: response.data.artist || 'Unknown',
            lyrics: response.data.lyrics,
            source: 'lyrist'
        };
    }
    throw new Error('Not found');
}

const lyricsCommand = async (sock, chatId, message, args) => {
    try {
        let query = args || '';
        if (!query) {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quoted && (quoted.conversation || quoted.extendedTextMessage?.text)) {
                query = (quoted.conversation || quoted.extendedTextMessage?.text || '').trim();
            }
            if (!query) {
                await sock.sendMessage(chatId, {
                    text: '❌ *Usage:* .lyrics <song title> or .lyrics <artist> - <title>\n\nExamples:\n• .lyrics Dior Pop Smoke\n• .lyrics Ruth B - Dandelions\n• .lyrics Blinding Lights The Weeknd'
                }, { quoted: message });
                return;
            }
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        let result = null;
        let errorMsg = '';

        // Parse query
        const { artist, title } = parseQuery(query);

        // Try API 1: lyrics.ovh if we have artist and title
        if (artist && title) {
            try {
                result = await fetchLyricsOvh(artist, title);
            } catch (e) {
                errorMsg = e.message;
                console.log(`lyrics.ovh failed for ${artist} - ${title}: ${e.message}`);
            }
        }

        // If failed, try Some Random API
        if (!result) {
            try {
                result = await fetchLyricsSomeRandom(query);
            } catch (e) {
                errorMsg = e.message;
                console.log(`SomeRandom failed: ${e.message}`);
            }
        }

        // If still failed, try Lyrist
        if (!result) {
            try {
                result = await fetchLyricsLyrist(query);
            } catch (e) {
                errorMsg = e.message;
                console.log(`Lyrist failed: ${e.message}`);
            }
        }

        if (!result) {
            throw new Error(`No lyrics found for "${query}". Try using "Artist - Song Title" format.`);
        }

        const senderId = message.key.participant || message.key.remoteJid;
        const mention = getMentionNumber(senderId);
        const greeting = getGreeting();

        let caption = `✨ ${greeting} @${mention}\n\n`;
        caption += `🎵 *LYRICS*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        caption += `*Title:* ${result.title}\n`;
        caption += `*Artist:* ${result.artist}\n`;
        caption += `\n*Lyrics:*\n${result.lyrics}\n\n`;
        caption += `🚀 *BIGMANj MD* — Fast • Powerful • Reliable\n\n> bigmanj tech™`;
        caption += `\n_📡 via ${result.source}_`;

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
        let errorMsg = error.message || '❌ *Lyrics not found.*\nTry a different song title or use format: Artist - Song Title';
        if (error.message.includes('timeout')) errorMsg = '⏰ Request timeout. Try again.';
        if (error.message.includes('network')) errorMsg = '🌐 Network error. Try later.';
        await sock.sendMessage(chatId, { text: errorMsg }, { quoted: message });
    }
};

module.exports = lyricsCommand;