const axios = require('axios');
const moment = require('moment-timezone');

const getMentionNumber = (jid) => jid.split('@')[0];
const getGreeting = () => {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
};

// Helper to format duration from seconds
function formatDuration(seconds) {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ---------- API 1: Lyrist (best, no key) ----------
async function fetchLyricsLyrist(query) {
    const url = `https://lyrist.vercel.app/api/lyrics?q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, { timeout: 10000 });
    if (response.data && response.data.lyrics) {
        return {
            title: response.data.title || 'Unknown',
            artist: response.data.artist || 'Unknown',
            lyrics: response.data.lyrics,
            duration: null,
            album: null
        };
    }
    throw new Error('Lyrist not found');
}

// ---------- API 2: Some Random API (backup) ----------
async function fetchLyricsSomeRandom(query) {
    const url = `https://some-random-api.com/lyrics?title=${encodeURIComponent(query)}`;
    const response = await axios.get(url, { timeout: 10000 });
    if (response.data && response.data.lyrics) {
        return {
            title: response.data.title,
            artist: response.data.author,
            lyrics: response.data.lyrics,
            duration: null,
            album: null
        };
    }
    throw new Error('SomeRandom not found');
}

// ---------- API 3: Genius (requires API key) ----------
// To use Genius, get a free API key from https://genius.com/api-clients
// Then set process.env.GENIUS_API_KEY or replace 'YOUR_GENIUS_KEY'
async function fetchLyricsGenius(query) {
    const apiKey = process.env.GENIUS_API_KEY || 'YOUR_GENIUS_KEY'; // Replace or set env
    if (!apiKey || apiKey === 'YOUR_GENIUS_KEY') {
        throw new Error('Genius API key not configured');
    }
    // Search for song
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(query)}`;
    const searchRes = await axios.get(searchUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000
    });
    const hits = searchRes.data.response.hits;
    if (!hits.length) throw new Error('Genius no results');
    const songPath = hits[0].result.url;
    // Genius doesn't provide raw lyrics via API, we'd need to scrape.
    // For simplicity, we'll skip Genius or just return the URL.
    // Instead, we'll use a free lyrics scraper fallback.
    throw new Error('Genius not fully supported without scraping');
}

// ---------- Main command with fallback ----------
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
                    text: '❌ *Usage:* .lyrics <song title>\nExample: .lyrics Dior Pop Smoke'
                }, { quoted: message });
                return;
            }
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        let result = null;
        let apiUsed = '';

        // Try Lyrist first
        try {
            result = await fetchLyricsLyrist(query);
            apiUsed = 'Lyrist';
        } catch (err) {
            console.log('Lyrist failed, trying SomeRandom...');
            try {
                result = await fetchLyricsSomeRandom(query);
                apiUsed = 'SomeRandom';
            } catch (err2) {
                console.log('SomeRandom failed, no more fallbacks');
                throw new Error('No lyrics found from any source');
            }
        }

        const senderId = message.key.participant || message.key.remoteJid;
        const mention = getMentionNumber(senderId);
        const greeting = getGreeting();

        let caption = `✨ ${greeting} @${mention}\n\n`;
        caption += `🎵 *LYRICS*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        caption += `*Title:* ${result.title}\n`;
        caption += `*Artist:* ${result.artist}\n`;
        if (result.album) caption += `*Album:* ${result.album}\n`;
        if (result.duration) caption += `*Duration:* ${formatDuration(result.duration)}\n`;
        caption += `\n*Lyrics:*\n${result.lyrics}\n\n`;
        caption += `🚀 *BIGMANj MD* — Fast • Powerful • Reliable\n\n> bigmanj tech™`;
        caption += `\n_⚡ via ${apiUsed}_`;

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
        let errorMsg = '❌ *Lyrics not found.*\nTry a different song title or check spelling.';
        if (error.message.includes('timeout')) errorMsg = '⏰ Request timeout. Try again.';
        if (error.message.includes('network')) errorMsg = '🌐 Network error. Try later.';
        await sock.sendMessage(chatId, { text: errorMsg }, { quoted: message });
    }
};

module.exports = lyricsCommand;