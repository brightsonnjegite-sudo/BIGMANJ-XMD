const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Paths za kuhifadhi data
const STATE_PATH = path.join(__dirname, '..', 'data', 'chatbot.json');
const MEMORY_PATH = path.join(__dirname, '..', 'data', 'chatbot_memory.json');

// --- HELPERS ---
function loadState() {
    try {
        if (!fs.existsSync(STATE_PATH)) return { perGroup: {}, private: false };
        const data = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
        return { perGroup: {}, private: false, ...data };
    } catch (e) { return { perGroup: {}, private: false }; }
}

function saveState(state) {
    try {
        const dir = path.dirname(STATE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    } catch (e) { console.error('❌ State Save Err:', e); }
}

function loadMemory() {
    try {
        if (!fs.existsSync(MEMORY_PATH)) return {};
        const data = JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8'));
        const now = Date.now();
        let changed = false;
        for (const id in data) {
            if (data[id].lastUpdate && (now - data[id].lastUpdate > 600000)) {
                delete data[id];
                changed = true;
            }
        }
        if (changed) saveMemory(data);
        return data;
    } catch (e) { return {}; }
}

function saveMemory(memory) {
    try {
        const dir = path.dirname(MEMORY_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
    } catch (e) { console.error('❌ Memory Save Err:', e); }
}

// Detect media type and extract caption/info
function detectMediaAndText(m) {
    const msg = m.message;
    if (!msg) return { type: 'none', text: '', caption: '' };

    // Sticker
    if (msg.stickerMessage) {
        return { type: 'sticker', text: '[Sticker]', caption: '' };
    }
    // GIF (videoMessage with gifPlayback true)
    if (msg.videoMessage && msg.videoMessage.gifPlayback) {
        const caption = msg.videoMessage.caption || '';
        return { type: 'gif', text: caption || '[GIF]', caption };
    }
    // Video (normal)
    if (msg.videoMessage && !msg.videoMessage.gifPlayback) {
        const caption = msg.videoMessage.caption || '';
        const seconds = msg.videoMessage.seconds || 0;
        return { type: 'video', text: caption || `[Video, ${Math.round(seconds)}s]`, caption, duration: seconds };
    }
    // Voice note
    if (msg.audioMessage && msg.audioMessage.ptt === true) {
        const seconds = msg.audioMessage.seconds || 0;
        return { type: 'voice', text: `[Voice note, ${Math.round(seconds)}s]`, caption: '', duration: seconds };
    }
    // WhatsApp audio (not voice note) - check duration between 60-120 seconds
    if (msg.audioMessage && msg.audioMessage.ptt !== true) {
        const seconds = msg.audioMessage.seconds || 0;
        if (seconds >= 60 && seconds <= 120) {
            return { type: 'audio', text: `[Audio, ${Math.round(seconds)}s]`, caption: '', duration: seconds };
        } else {
            // ignore very short/long audio
            return { type: 'ignore', text: '', caption: '' };
        }
    }
    // Image (optional, but we can handle)
    if (msg.imageMessage) {
        const caption = msg.imageMessage.caption || '';
        return { type: 'image', text: caption || '[Image]', caption };
    }
    // Text
    const text = (
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        ''
    ).trim();
    if (text) return { type: 'text', text, caption: '' };

    return { type: 'none', text: '', caption: '' };
}

// --- MAIN CHATBOT HANDLER ---
async function handleChatbotMessage(sock, chatId, m, userText = null) {
    try {
        if (!chatId || m.key?.fromMe) return;

        // Detect media and text
        const { type, text, caption, duration } = detectMediaAndText(m);
        if (type === 'ignore') return; // skip short/long audio

        // For text, use provided userText or detected text
        let finalText = text;
        if (type === 'text' && userText) finalText = userText;
        if (!finalText && type !== 'none') finalText = `[${type}]`;

        // Puuza commands na maandishi maalum
        if (type === 'text' && (finalText.startsWith('.') || finalText.startsWith('!') || finalText.startsWith('/'))) return;

        const state = loadState();
        const isGroup = chatId.endsWith('@g.us');
        const enabled = isGroup ? !!state.perGroup?.[chatId]?.enabled : !!state.private;
        if (!enabled) return;

        // Typing indicator
        sock.sendPresenceUpdate('composing', chatId).catch(() => {});

        let memory = loadMemory();
        if (!memory[chatId]) memory[chatId] = { chats: [], lastUpdate: Date.now() };

        const userName = m.pushName || 'Mshkaji';

        // Prepare user input for history (transform media into text)
        let userDisplay = finalText;
        if (type !== 'text') {
            if (type === 'sticker') userDisplay = "💠 alituma stika";
            else if (type === 'gif') userDisplay = `🎞️ alituma GIF: ${caption ? `"${caption}"` : 'bila caption'}`;
            else if (type === 'video') userDisplay = `📹 alituma video ya ${Math.round(duration)}s: ${caption ? `"${caption}"` : ''}`;
            else if (type === 'voice') userDisplay = `🎙️ alituma ujumbe wa sauti (${Math.round(duration)}s)`;
            else if (type === 'audio') userDisplay = `🎵 alituma wimbo wa WhatsApp (${Math.round(duration)}s)`;
            else if (type === 'image') userDisplay = `🖼️ alituma picha: ${caption ? `"${caption}"` : ''}`;
        }

        // Save to memory
        memory[chatId].chats.push({ role: "user", content: userDisplay, name: userName });
        memory[chatId].lastUpdate = Date.now();
        if (memory[chatId].chats.length > 6) memory[chatId].chats.shift();

        const history = memory[chatId].chats
            .map(msg => `${msg.role === 'user' ? msg.name : 'Bigmanj'}: ${msg.content}`)
            .join("\n");

        // System prompt (same as before, but no buttons)
        const systemPrompt = `[ROLE]: Wewe ni 𝙱𝙸𝙶𝙼𝙰𝙽𝚓 V3, genius chatbot uliyetengenezwa na BIGMANJ (Quantum Code Dev).
[TARGET]: Unaongea na "${userName}".

[STRICT RULES]:
1. IDENTITY: Ukilaaniwa au ukiulizwa wewe ni nani, kataa kabisa kuwa ChatGPT au OpenAI. Wewe ni 𝙱𝚒𝚐ｍａ𝚗𝚓 wa 𝙱𝚒𝚐 Labs!
2. PERSONALITY: Ongea kishkaji sana (Tanzanian Slang). Tumia maneno kama 'Oya', 'Niaje', 'Mwanangu', 'Wadao', 'Fresh'.
3. CONTEXT: Mtaje "${userName}" unapoona inafaa.
4. BREVITY: Majibu yawe mafupi, yasiyochosha, straight to the point.
5. OWNER: Masuala ya kitalaamu mwelekeze kwa 𝚋𝚒𝚐𝚖𝚊𝚗𝚓 (255777580820).
6. FORMAT: Jibu kwa maandishi ya kawaida (plain text) pekee. Usitengeneze button wala alama za interactive.`;

        let fullPrompt = `${systemPrompt}\n\n---\nCHAT_HISTORY:\n${history}\n\n---\nUSER: ${userName}\nINPUT: ${userDisplay}\nBIGMANJ:`;

        // Call API (fast)
        const apiUrl = `https://api.yupra.my.id/api/ai/gpt5?text=${encodeURIComponent(fullPrompt)}`;
        const fetchRes = await fetch(apiUrl);
        const res = await fetchRes.json();

        let reply = res?.response || res?.result || res?.message || res?.data || "";
        if (!reply) {
            // Fallback quick replies for media
            if (type === 'sticker') reply = "Stika nzuri mwanangu! 😂";
            else if (type === 'gif') reply = "Hiyo GIF inachekesha sana! 😄";
            else if (type === 'video') reply = "Video poa, lakini naomba nione caption yake? 🤔";
            else if (type === 'voice') reply = "Nimesikia sauti yako, lakini bado sijajifunza kusoma sauti. Njoo na maandishi boss! 🎤";
            else if (type === 'audio') reply = "Wimbo mzuri! Lakini mimi ni chatbot ya maandishi tu. Tuma caption au maoni yako. 🎵";
            else if (type === 'image') reply = "Picha nzuri! Ina maana gani? 💬";
            else reply = "Nimekupata, lakini nisaidie kwa maandishi tafadhali.";
        }

        // Clean AI names
        reply = reply.replace(/Microsoft|Copilot|AI Assistant|OpenAI|GPT-3|GPT-4|ChatGPT/gi, "BIGMANj");

        // Save assistant reply
        memory[chatId].chats.push({ role: "assistant", content: reply });
        saveMemory(memory);

        // Send response
        await sock.sendMessage(chatId, { text: reply }, { quoted: m });

    } catch (e) { 
        console.error('❌ Chatbot Error:', e); 
    }
}

// --- COMMAND HANDLER (ON/OFF) ---
async function groupChatbotToggleCommand(sock, chatId, m, body) {
    try {
        const state = loadState();
        const args = (body || '').trim().split(/\s+/);
        const sub = args[0]?.toLowerCase();

        if (sub === 'private') {
            state.private = (args[1]?.toLowerCase() === 'on');
            saveState(state);
            return await sock.sendMessage(chatId, { text: `✅ *Private Chatbot:* ${state.private ? 'ON 🟢' : 'OFF 🔴'}` }, { quoted: m });
        }

        if (sub === 'on' || sub === 'off') {
            const isEnable = (sub === 'on');
            if (chatId.endsWith('@g.us')) {
                if (!state.perGroup) state.perGroup = {};
                state.perGroup[chatId] = { enabled: isEnable };
            } else {
                state.private = isEnable;
            }
            saveState(state);
            return await sock.sendMessage(chatId, { text: `✅ *Chatbot:* ${isEnable ? 'ON 🟢' : 'OFF 🔴'}` }, { quoted: m });
        }

        const helpMsg = `🤖 *𝖡𝖨𝖦𝖬𝖠𝖭j CHATBOT*\n\n.chatbot on/off (Kwa group)\n.chatbot private on/off (Kwa DM)`;
        return await sock.sendMessage(chatId, { text: helpMsg }, { quoted: m });
    } catch (e) { console.error('❌ Toggle Error:', e); }
}

module.exports = { handleChatbotMessage, groupChatbotToggleCommand };