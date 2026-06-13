const moment = require('moment-timezone');
const nexray = require('api-nexray');   // new API package

const getMentionNumber = (jid) => jid.split('@')[0];
const getGreeting = () => {
    const hour = moment().tz('Africa/Dar_es_Salaam').hour();
    if (hour >= 5 && hour < 12) return '🌅 Habari za Asubuhi';
    if (hour >= 12 && hour < 18) return '🌤️ Habari za Mchana';
    return '🌙 Habari za Jioni';
};

// Helper to extract artist/title from query
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

// Nexray API using the new package
async function fetchFromNexray(query) {
    const response = await nexray.get('/search/lyrics', {
        q: query
    });
    // The structure from your example: response = { status, result: { lyrics: { plain_lyrics, track_name, artist_name } } }
    if (response && response.status === true && response.result && response.result.lyrics && response.result.lyrics.plain_lyrics) {
        return {
            title: response.result.lyrics.track_name || response.result.title,
            artist: response.result.lyrics.artist_name || response.result.artist,
            lyrics: response.result.lyrics.plain_lyrics,
            source: 'Nexray'
        };
    }
    throw new Error('No lyrics from Nexray');
}

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

        let result = await fetchFromNexray(query);

        if (!result) {
            throw new Error(`No lyrics found for "${query}". Try a different song title.`);
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