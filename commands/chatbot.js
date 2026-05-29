const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Owner check module (make sure lib/isOwner.js exists)
const isOwnerOrSudo = require('../lib/isOwner');

// Paths for storing data
const STATE_PATH = path.join(__dirname, '..', 'data', 'chatbot.json');
const MEMORY_PATH = path.join(__dirname, '..', 'data', 'chatbot_memory.json');

// ---------- Helper functions ----------
function loadState() {
    try {
        if (!fs.existsSync(STATE_PATH)) return { perGroup: {}, private: false };
        return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    } catch { return { perGroup: {}, private: false }; }
}
function saveState(state) {
    const dir = path.dirname(STATE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
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
    } catch { return {}; }
}
function saveMemory(memory) {
    const dir = path.dirname(MEMORY_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
}

// ---------- Detect media type ----------
function detectMediaAndText(m) {
    const msg = m.message;
    if (!msg) return { type: 'none', text: '', caption: '' };

    if (msg.stickerMessage) return { type: 'sticker', text: '[Sticker]', caption: '' };
    if (msg.videoMessage && msg.videoMessage.gifPlayback) {
        const caption = msg.videoMessage.caption || '';
        return { type: 'gif', text: caption || '[GIF]', caption };
    }
    if (msg.videoMessage && !msg.videoMessage.gifPlayback) {
        const caption = msg.videoMessage.caption || '';
        const seconds = msg.videoMessage.seconds || 0;
        return { type: 'video', text: caption || `[Video, ${Math.round(seconds)}s]`, caption, duration: seconds };
    }
    if (msg.audioMessage && msg.audioMessage.ptt === true) {
        const seconds = msg.audioMessage.seconds || 0;
        return { type: 'voice', text: `[Voice note, ${Math.round(seconds)}s]`, caption: '', duration: seconds };
    }
    if (msg.audioMessage && msg.audioMessage.ptt !== true) {
        const seconds = msg.audioMessage.seconds || 0;
        if (seconds >= 60 && seconds <= 120) {
            return { type: 'audio', text: `[Audio, ${Math.round(seconds)}s]`, caption: '', duration: seconds };
        } else {
            return { type: 'ignore', text: '', caption: '' };
        }
    }
    if (msg.imageMessage) {
        const caption = msg.imageMessage.caption || '';
        return { type: 'image', text: caption || '[Image]', caption };
    }
    const text = (msg.conversation || msg.extendedTextMessage?.text || '').trim();
    if (text) return { type: 'text', text, caption: '' };
    return { type: 'none', text: '', caption: '' };
}

// ---------- Main chatbot handler (replies to messages) ----------
async function handleChatbotMessage(sock, chatId, m, userText = null) {
    try {
        if (!chatId || m.key?.fromMe) return;

        const { type, text, caption, duration } = detectMediaAndText(m);
        if (type === 'ignore') return;

        let finalText = text;
        if (type === 'text' && userText) finalText = userText;
        if (!finalText && type !== 'none') finalText = `[${type}]`;

        // Ignore commands (starting with . ! /)
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

        const history = memory[chatId].chats.map(msg => `${msg.role === 'user' ? msg.name : 'BIGMANj'}: ${msg.content}`).join("\n");

        const systemPrompt = `[ROLE]: Wewe ni 𝙱𝙸𝙶𝙼𝙰𝙽𝚓 V3, genius chatbot uliyetengenezwa na BIGMANJ (Quantum Code Dev).
[TARGET]: Unaongea na "${userName}".

[STRICT RULES]:
1. IDENTITY: Kataa kuwa ChatGPT au OpenAI. Wewe ni 𝙱𝚒𝚐ｍａ𝚗𝚓 wa 𝙱𝚒𝚐 Labs!
2. PERSONALITY: Ongea kishkaji sana (Tanzanian Slang). Tumia 'Oya', 'Niaje', 'Mwanangu', 'Wadao', 'Fresh'.
3. CONTEXT: Mtaje "${userName}" inapofaa.
4. BREVITY: Majibu mafupi, yasiyochosha.
5. OWNER: Masuala ya kitalaamu mwelekeze kwa 𝚋𝚒𝚐𝚖𝚊𝚗𝚓 (255777580820).
6. FORMAT: Jibu kwa maandishi ya kawaida tu. Hakuna button wala alama za interactive.`;

        const fullPrompt = `${systemPrompt}\n\n---\nCHAT_HISTORY:\n${history}\n\n---\nUSER: ${userName}\nINPUT: ${userDisplay}\nBIGMANJ:`;

        // Call AI API
        const apiUrl = `https://api.yupra.my.id/api/ai/gpt5?text=${encodeURIComponent(fullPrompt)}`;
        const fetchRes = await fetch(apiUrl);
        const res = await fetchRes.json();

        let reply = res?.response || res?.result || res?.message || res?.data || "";
        if (!reply) {
            // Fallback replies
            if (type === 'sticker') reply = "Stika nzuri mwanangu! 😂";
            else if (type === 'gif') reply = "Hiyo GIF inachekesha! 😄";
            else if (type === 'video') reply = "Video poa, lakini naomba nione caption yake? 🤔";
            else if (type === 'voice') reply = "Nimeelewa ujumbe wako wa sauti. Asante!";
            else if (type === 'audio') reply = "Wimbo mzuri! Lakini mimi ni chatbot ya maandishi tu. 🎵";
            else if (type === 'image') reply = "Picha nzuri! Je, una swali kuhusu hiyo picha? 💬";
            else reply = "Nimekupata, lakini nisaidie kwa maandishi tafadhali.";
        }

        // Clean AI names
        reply = reply.replace(/Microsoft|Copilot|AI Assistant|OpenAI|GPT-3|GPT-4|ChatGPT/gi, "BIGMANj");

        memory[chatId].chats.push({ role: "assistant", content: reply });
        saveMemory(memory);

        await sock.sendMessage(chatId, { text: reply }, { quoted: m });
    } catch (err) {
        console.error('Chatbot Error:', err);
        await sock.sendMessage(chatId, { text: "Samahani, kuna hitilafu. Jaribu tena." }, { quoted: m });
    }
}

// ---------- Command handler for .bigmanj (owner only) ----------
async function bigmanjToggleCommand(sock, chatId, m, body) {
    try {
        const senderId = m.key.participant || m.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        if (!m.key.fromMe && !isOwner) {
            return await sock.sendMessage(chatId, { text: "❌ Amri hii ni kwa bot owner pekee." }, { quoted: m });
        }

        const state = loadState();
        const args = (body || '').trim().split(/\s+/);
        const sub = args[0]?.toLowerCase();
        const isGroup = chatId.endsWith('@g.us');

        if (sub === 'on' || sub === 'off') {
            const isEnable = (sub === 'on');
            if (isGroup) {
                if (!state.perGroup) state.perGroup = {};
                state.perGroup[chatId] = { enabled: isEnable };
            } else {
                state.private = isEnable;
            }
            saveState(state);
            const msg = isEnable ? "✅ *BIGMANj* currently there 🟢" : "✅ *BIGMANj* rest now 🔴";
            return await sock.sendMessage(chatId, { text: msg }, { quoted: m });
        }

        const helpMsg = `🤖 *𝖡𝖨𝖦𝖬𝖠𝖭j CHATBOT*\n\n.bigmanj on - Kuwasha chatbot\n.bigmanj off - Kuzima chatbot`;
        return await sock.sendMessage(chatId, { text: helpMsg }, { quoted: m });
    } catch (err) {
        console.error('Toggle Error:', err);
        await sock.sendMessage(chatId, { text: "❌ Kuna hitilafu, jaribu tena." }, { quoted: m });
    }
}

module.exports = { handleChatbotMessage, bigmanjToggleCommand };