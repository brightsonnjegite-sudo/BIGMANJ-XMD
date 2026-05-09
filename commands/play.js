const axios = require('axios');
const yts = require('yt-search');

const AXIOS_DEFAULTS = {
    timeout: 30000, // Reduced timeout for faster response
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

// Enhanced retry mechanism with exponential backoff
async function tryRequest(getter, attempts = 3) {
    let lastErr;
    for (let i = 1; i <= attempts; i++) {
        try {
            return await getter();
        } catch (err) {
            lastErr = err;
            if (i < attempts) {
                const delay = Math.min(1000 * Math.pow(2, i - 1), 5000); // Exponential backoff, max 5s
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    throw lastErr;
}

// Get MP3 from YouTube with enhanced error handling
async function getYoutubeMp3(ytUrl) {
    const apis = [
        `https://apiskeith.top/download/mp3?url=${encodeURIComponent(ytUrl)}`,
        `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(ytUrl)}`,
        `https://api.giftedtech.my.id/api/download/ytmp3?url=${encodeURIComponent(ytUrl)}`
    ];

    for (const api of apis) {
        try {
            const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
            if (res.data?.status && res.data?.result) {
                return { download: res.data.result };
            }
        } catch (err) {
            console.log(`API ${api} failed, trying next...`);
            continue;
        }
    }
    throw new Error('All MP3 APIs failed');
}

// Get MP4 from YouTube with enhanced error handling
async function getYoutubeMp4(ytUrl) {
    const apis = [
        `https://apiskeith.top/download/mp4?url=${encodeURIComponent(ytUrl)}`,
        `https://api.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(ytUrl)}`,
        `https://api.giftedtech.my.id/api/download/ytmp4?url=${encodeURIComponent(ytUrl)}`
    ];

    for (const api of apis) {
        try {
            const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
            if (res.data?.status && res.data?.result) {
                return { download: res.data.result };
            }
        } catch (err) {
            console.log(`API ${api} failed, trying next...`);
            continue;
        }
    }
    throw new Error('All MP4 APIs failed');
}

async function playCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const q = text.split(' ').slice(1).join(' ').trim();

        if (!q) return sock.sendMessage(chatId, { text: '🎵 *Unataka wimbo gani?*\n\n📝 Mfano: `.play Darude Sandstorm`' });

        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        // Enhanced YouTube search with better error handling
        const s = await yts(q);
        const v = s?.videos?.[0];
        if (!v) return sock.sendMessage(chatId, { text: '❌ Sikuipata wimbo huo! Jaribu kutafuta kwa maneno mengine.' });

        // Send thumbnail first for better UX
        try {
            await sock.sendMessage(chatId, {
                image: { url: v.thumbnail },
                caption: `🎵 *${v.title}*\n⏱️ *Muda:* ${v.timestamp}\n👤 *Msanii:* ${v.author.name}\n👁️ *Views:* ${v.views?.toLocaleString() || 'N/A'}\n\n📥 *Inapakua...*`
            }, { quoted: message });
        } catch (thumbErr) {
            console.log('Thumbnail send failed, continuing...');
        }

        // Direct download MP3 with enhanced handling
        await handleAudioDownload(sock, chatId, v.url, message, v);

    } catch (err) {
        console.error('[PLAY] Error:', err?.message || err);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        sock.sendMessage(chatId, { text: '❌ *Hitilafu!* ' + (err.message || 'Jaribu tena baadae') });
    }
}

// Enhanced audio download with thumbnail integration
async function handleAudioDownload(sock, chatId, ytUrl, message, videoInfo = null) {
    try {
        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });

        const data = await getYoutubeMp3(ytUrl);

        // Send audio with enhanced metadata
        const audioMessage = {
            audio: { url: data.download },
            mimetype: 'audio/mp4',
            ptt: false,
            fileName: videoInfo?.title ? `${videoInfo.title}.mp3` : 'audio.mp3'
        };

        // Add context info if available
        if (videoInfo) {
            audioMessage.contextInfo = {
                externalAdReply: {
                    title: videoInfo.title,
                    body: `👤 ${videoInfo.author.name}`,
                    thumbnailUrl: videoInfo.thumbnail,
                    sourceUrl: ytUrl,
                    mediaType: 2,
                    showAdAttribution: true
                }
            };
        }

        await sock.sendMessage(chatId, audioMessage, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (e) {
        console.error('Audio download error:', e);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, { text: "❌ *Download imefeli:* " + (e.message || 'API haipatikani') }, { quoted: message });
    }
}

// Enhanced video download with thumbnail integration
async function handleVideoDownload(sock, chatId, ytUrl, message, videoInfo = null) {
    try {
        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });

        const data = await getYoutubeMp4(ytUrl);

        // Send video with enhanced metadata
        const videoMessage = {
            video: { url: data.download },
            mimetype: 'video/mp4',
            caption: videoInfo ? `✅ *${videoInfo.title}*\n> *Mickey Glitch*` : `✅ Tayari!\n> *Mickey Glitch*`,
            fileName: videoInfo?.title ? `${videoInfo.title}.mp4` : 'video.mp4'
        };

        // Add context info if available
        if (videoInfo) {
            videoMessage.contextInfo = {
                externalAdReply: {
                    title: videoInfo.title,
                    body: `👤 ${videoInfo.author.name}`,
                    thumbnailUrl: videoInfo.thumbnail,
                    sourceUrl: ytUrl,
                    mediaType: 2,
                    showAdAttribution: true
                }
            };
        }

        await sock.sendMessage(chatId, videoMessage, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (e) {
        console.error('Video download error:', e);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, { text: "❌ *Download imefeli:* " + (e.message || 'API haipatikani') }, { quoted: message });
    }
}

module.exports = playCommand;
module.exports.handleAudioDownload = handleAudioDownload;
module.exports.handleVideoDownload = handleVideoDownload;
module.exports.getYoutubeMp3 = getYoutubeMp3;
module.exports.getYoutubeMp4 = getYoutubeMp4;
