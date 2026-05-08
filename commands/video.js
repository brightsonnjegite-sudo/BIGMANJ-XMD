const { sendGiftedButtons } = require('gifted-btns');
const axios = require('axios');
const yts = require('yt-search');

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

// Function ya kujaribu API (Retries)
async function tryRequest(getter, attempts = 3) {
    let lastErr;
    for (let i = 1; i <= attempts; i++) {
        try { return await getter(); } 
        catch (err) { lastErr = err; if (i < attempts) await new Promise(r => setTimeout(r, 1000 * i)); }
    }
    throw lastErr;
}

// 1. MP4 Downloader kwa ajili ya JSON mpya ({ status, creator, result })
async function getKeithVideoByUrl(ytUrl) {
    const api = `https://apiskeith.top/download/mp4?url=${encodeURIComponent(ytUrl)}`;
    const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
    
    // Inasoma muundo: { "status": true, "result": "https://..." }
    if (res.data?.status && res.data?.result) {
        return { download: res.data.result };
    }
    throw new Error('Keith MP4 API failed');
}

// Main Video Command
async function videoCommand(sock, chatId, message, args) {
    try {
        const q = Array.isArray(args) ? args.join(' ') : (message.message?.conversation || message.message?.extendedTextMessage?.text || "").split(' ').slice(1).join(' ').trim();

        if (!q) return sock.sendMessage(chatId, { text: 'Unataka video gani?' });

        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        // Tafuta YouTube
        let vUrl, vTitle, vThumb;
        if (q.startsWith('http')) {
            vUrl = q;
        } else {
            const { videos } = await yts(q);
            if (!videos?.[0]) return sock.sendMessage(chatId, { text: '❌ Sikuipata!' });
            vUrl = videos[0].url;
            vTitle = videos[0].title;
            vThumb = videos[0].thumbnail;
        }

        // Tuma Button ya kuchagua (Gifted-btns)
        const buttons = [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "🎥 MP4 VIDEO",
                    id: `.getvideo ${vUrl}`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "🎵 MP3 AUDIO",
                    id: `.getaudio ${vUrl}`
                })
            }
        ];

        await sendGiftedButtons({
            sock: sock,
            chatId: chatId,
            body: `🎬 *Title:* ${vTitle || 'YouTube Video'}\n\nChagua format unayotaka hapo chini:`,
            footer: "Mickey Glitch",
            title: "VIDEO DOWNLOADER",
            media: { image: { url: vThumb } },
            buttons: buttons,
            quoted: message
        });

    } catch (err) {
        console.error('[VIDEO] Error:', err.message);
        sock.sendMessage(chatId, { text: '❌ Hitilafu: ' + err.message });
    }
}

// Function ya kudownload na kutuma (Iite hii kwenye handler yako ya buttons)
async function handleVideoDownload(sock, chatId, vUrl, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });
        
        // Jaribu API ya JSON mpya tuliyoboresha
        const data = await getKeithVideoByUrl(vUrl);
        
        await sock.sendMessage(chatId, {
            video: { url: data.download },
            mimetype: 'video/mp4',
            caption: `✅ Tayari!\n> *Mickey Glitch*`
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (e) {
        sock.sendMessage(chatId, { text: "❌ Download imefeli: " + e.message });
    }
}

module.exports = { videoCommand, getKeithVideoByUrl, handleVideoDownload };
