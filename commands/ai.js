const axios = require('axios');

/**
 * ai.js - BIGMANj AI Assistant (Enhanced Fully Integrated Version)
 * Creator: bigmanj (Quantum Code Developer)
 */
const aiCommand = async (sock, chatId, msg, args) => {
    // Extract query from arguments
    const query = Array.isArray(args) ? args.join(' ') : args;

    if (!query) {
        return sock.sendMessage(chatId, {
            text: '╭━━━〔 *BIGMANj AI* 〕━━━┈⊷\n┃\n┃ 📝 *Usage:* `.ai [swali lako]`\n┃ 💡 *Example:* `.ai mambo vipi?`\n┃\n╰━━━━━━━━━━━━━━━━━━━━┈⊷'
        }, { quoted: msg });
    }

    // Length protection
    if (query.length > 5000) {
        return sock.sendMessage(chatId, { text: '⚠️ *Mzee, swali lako ni refu kupita kiasi! Punguza kidogo.*' }, { quoted: msg });
    }

    // Thinking reaction
    await sock.sendMessage(chatId, { react: { text: '🧠', key: msg.key } }).catch(() => {});

    try {
        // System prompt – identity and rules (no “Mickey”)
        const systemPrompt = `[ROLE]: Wewe ni BIGMANj V3, genius AI msaidizi uliyetengenezwa na BIGMANj (Quantum Code Dev).
[CONTEXT]: Repo yako ipo hapa: https://github.com/brightsonnjegite-sudo/Mickey-Glitch (inayoendeshwa na bigmanj).
[RULES]:
- Ongea kishkaji (Bongo Swahili Slang).
- Jibu yawe mafupi na yenye akili, moja kwa moja kwenye swali lililoulizwa.
- Usijitaje kama AI wa OpenAI au Microsoft.
- Kama ishu ni ngumu, waambie wamcheki bigmanj (255612130873).`;

        const fullQuery = `${systemPrompt}\n\nSwali la mtumiaji: ${query}\nJibu lako fupi, kwa Kiswahili cha kishkaji, lenye ufahamu:`;

        // Multi-API fallback list (reliable endpoints)
        const apiUrls = [
            `https://api.popcat.xyz/gpt?prompt=${encodeURIComponent(fullQuery)}`,
            `https://api.ryzendesu.xyz/api/ai/gpt?text=${encodeURIComponent(fullQuery)}`,
            `https://api.azz.biz.id/api/gpt?text=${encodeURIComponent(fullQuery)}`
        ];

        let finalReply = null;

        // Loop through APIs until one works
        for (const url of apiUrls) {
            try {
                const res = await axios.get(url, { timeout: 15000 });
                const data = res.data;
                // Try different response formats
                let tempReply = data.response || data.result || data.message || data.reply || data.data || data.text;
                if (tempReply && tempReply.length > 0 && !tempReply.includes('error')) {
                    finalReply = tempReply;
                    break;
                }
            } catch (apiErr) {
                console.log(`⚠️ API failed, trying next...`);
                continue;
            }
        }

        // Fallback to a simple open-source API if all others fail
        if (!finalReply) {
            const fallbackUrl = `https://api.siputzx.my.id/api/ai/gpt?text=${encodeURIComponent(fullQuery)}`;
            try {
                const res = await axios.get(fallbackUrl, { timeout: 15000 });
                const data = res.data;
                finalReply = data.result || data.data || data.response || null;
            } catch (e) {
                console.log('Fallback API also failed');
            }
        }

        // Send the answer
        if (finalReply) {
            // Clean up any wrong AI names
            finalReply = finalReply.replace(/Microsoft|Copilot|OpenAI|GPT-3|GPT-4|ChatGPT|Mickey/gi, "BIGMANj");

            const responseText = 
                `╭━━━━〔 *BIGMANj AI* 〕━━━━┈⊷\n` +
                `┃\n` +
                `┃ ${finalReply.trim()}\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━┈⊷\n\n> bigmanj tech`;

            await sock.sendMessage(chatId, { text: responseText }, { quoted: msg });
            await sock.sendMessage(chatId, { react: { text: '✨', key: msg.key } }).catch(() => {});
        } else {
            throw new Error("All APIs failed");
        }

    } catch (e) {
        console.error("AI Error:", e.message);
        await sock.sendMessage(chatId, {
            text: '❌ *Mzee, kijiwe kimeingiliwa na wadudu (Error). Jaribu baadaye kidogo au mcheki bigmanj.*\n\n> bigmanj tech'
        }, { quoted: msg });
        await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } }).catch(() => {});
    }
};

module.exports = aiCommand;