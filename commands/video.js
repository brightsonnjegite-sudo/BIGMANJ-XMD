const axios = require('axios');
const yts = require('yt-search');

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

// Retry mechanism for API requests
async function tryRequest(getter, attempts = 3) {
    let lastErr;
    for (let i = 1; i <= attempts; i++) {
        try { return await getter(); } 
        catch (err) { lastErr = err; if (i < attempts) await new Promise(r => setTimeout(r, 1000 * i)); }
    }
    throw lastErr;
}

// Get MP3 from YouTube
async function getYoutubeMp3(ytUrl) {
    const api = `https://apiskeith.top/download/mp3?url=${encodeURIComponent(ytUrl)}`;
    const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
    
    if (res.data?.status && res.data?.result) {
        return { download: res.data.result };
    }
    throw new Error('Keith MP3 API failed');
}

// Get MP4 from YouTube
async function getYoutubeMp4(ytUrl) {
    const api = `https://apiskeith.top/download/mp4?url=${encodeURIComponent(ytUrl)}`;
    const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
    
    if (res.data?.status && res.data?.result) {
        return { download: res.data.result };
    }
    throw new Error('Keith MP4 API failed');
}

// Video Command - Direct download MP4
async function videoCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const q = text.split(' ').slice(1).join(' ').trim();

        if (!q) return sock.sendMessage(chatId, { text: 'Unataka video gani?' });

        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        // Search on YouTube
        let vUrl;
        if (q.startsWith('http')) {
            vUrl = q;
        } else {
            const { videos } = await yts(q);
            if (!videos?.[0]) return sock.sendMessage(chatId, { text: '❌ Sikuipata!' });
            vUrl = videos[0].url;
        }

        // Direct download MP4
        await handleVideoDownload(sock, chatId, vUrl, message);

    } catch (err) {
        console.error('[VIDEO] Error:', err?.message || err);
        sock.sendMessage(chatId, { text: '❌ Hitilafu: ' + err.message });
    }
}

// Handle audio download (called from button response in main.js)
async function handleAudioDownload(sock, chatId, ytUrl, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });
        
        const data = await getYoutubeMp3(ytUrl);
        
        await sock.sendMessage(chatId, {
            audio: { url: data.download },
            mimetype: 'audio/mp4',
            ptt: false
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (e) {
        await sock.sendMessage(chatId, { text: "❌ Download imefeli: " + e.message }, { quoted: message });
    }
}

// Handle video download (called from button response in main.js)
async function handleVideoDownload(sock, chatId, ytUrl, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });
        
        const data = await getYoutubeMp4(ytUrl);
        
        await sock.sendMessage(chatId, {
            video: { url: data.download },
            mimetype: 'video/mp4',
            caption: `✅ Tayari!\n> *Mickey Glitch*`
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (e) {
        await sock.sendMessage(chatId, { text: "❌ Download imefeli: " + e.message }, { quoted: message });
    }
}

module.exports = videoCommand;
module.exports.handleAudioDownload = handleAudioDownload;
module.exports.handleVideoDownload = handleVideoDownload;
module.exports.getYoutubeMp3 = getYoutubeMp3;
module.exports.getYoutubeMp4 = getYoutubeMp4;
