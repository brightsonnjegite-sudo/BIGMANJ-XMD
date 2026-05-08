/**
 * halotel.js - Halotel Internet Packages with Integrated Anti-Bug & AI
 * Creator: Mickdadi Hamza (Quantum Code Developer)
 */

const { sendInteractiveMessage } = require('gifted-btns');
const axios = require('axios');
const fs = require('fs');

// ────────────────────────────────────────────────
// CONFIGURATION
// ────────────────────────────────────────────────
const CONFIG = {
    PRICE_PER_GB: 1000,
    SELLER_NUMBER: '255615944741@s.whatsapp.net',
    BANNER: 'https://files.catbox.moe/ljabyq.png',
    FOOTER: '🚀 Powered by Mickey Glitch Tech',
};

const PACKAGES = [
    { gb: 10, price: 10000, label: 'Standard Pack',  id: 'h_pkg_10' },
    { gb: 15, price: 15000, label: 'Bronze Pack',    id: 'h_pkg_15' },
    { gb: 20, price: 20000, label: 'Premium Pack',   id: 'h_pkg_20' },
    { gb: 25, price: 25000, label: 'Gold Pack',      id: 'h_pkg_25' }
];

// ────────────────────────────────────────────────
// [UTILITY FUNCTIONS] - Anti-Bug & Text Cleaning
// ────────────────────────────────────────────────
const antiBug = {
    clean: (text) => {
        if (!text) return '';
        return text.replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u0400-\u04FF\u1E00-\u1EFF\u2000-\u2BFF]/g, '').trim();
    },
    isSafe: (m, text) => {
        if (text.length > 5000) return false;
        const msgType = Object.keys(m.message || {})[0];
        const badTypes = ['protocolMessage', 'senderKeyDistributionMessage'];
        if (badTypes.includes(msgType)) return false;
        return true;
    }
};

// ────────────────────────────────────────────────
// [AI FUNCTION] - Multi-API Fallback
// ────────────────────────────────────────────────
async function getMickeyAIResponse(query, userName) {
    const systemPrompt = `Wewe ni MICKEY GLITCH V3, genius msaidizi wa Mickdadi Hamza. Ongea kishkaji. Unasaidia pia kuuza bando za Halotel kwa 1GB = 1000/= Tsh.`;
    const fullQuery = `${systemPrompt}\nUser ${userName}: ${query}\nAnswer:`;
    
    const apis = [
        `https://apiskeith.top/ai/gpt?q=${encodeURIComponent(fullQuery)}`,
        `https://apiskeith.top/ai/copilot?q=${encodeURIComponent(fullQuery)}`
    ];

    for (const url of apis) {
        try {
            const res = await axios.get(url, { timeout: 8000 });
            let reply = res.data.data || res.data.result || res.data.response;
            if (reply) return reply.replace(/ChatGPT|OpenAI|Microsoft/gi, "Mickey Glitch");
        } catch (e) { continue; }
    }
    return "Oya mwanangu, mtandao umeyumba kidogo. Jaribu baadae.";
}

// ────────────────────────────────────────────────
// HANDLE PACKAGE SELECTION
// ────────────────────────────────────────────────
async function handlePackageSelection(sock, chatId, m, packageId) {
    try {
        const cleanId = packageId.replace('.', '');
        const pkg = PACKAGES.find(p => p.id === cleanId);
        if (!pkg) return;

        const payMsg = `✅ *UMECHAGUA PACKAGE*\n\n` +
                      `📦 *Package:* ${pkg.label}\n` +
                      `💾 *GB:* ${pkg.gb} GB\n` +
                      `💰 *Bei:* TSh ${pkg.price.toLocaleString()}/=\n\n` +
                      `*JINSI YA KULIPIA:*\n` +
                      `• Lipa namba zilizopo hapa chini\n` +
                      `• Tuma Screenshot kwa @${CONFIG.SELLER_NUMBER.split('@')[0]}\n\n` +
                      `Asante kwa kuchagua Mickey Glitch!`;

        const paymentButtons = [
            { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📋 HALOTEL - 0615944741", copy_code: "0615944741" }) },
            { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📋 AZAMPESA - 1615944741", copy_code: "1615944741" }) },
            { name: "cta_call", buttonParamsJson: JSON.stringify({ display_text: "📞 Piga Halotel", phone_number: "0615944741" }) }
        ];

        await sendInteractiveMessage(sock, chatId, {
            text: payMsg,
            interactiveButtons: paymentButtons,
            footer: CONFIG.FOOTER,
            contextInfo: { mentionedJid: [CONFIG.SELLER_NUMBER] }
        }, { quoted: m });

    } catch (error) {
        console.error('[Selection Error]', error);
    }
}

// ────────────────────────────────────────────────
// MAIN COMMAND
// ────────────────────────────────────────────────
async function halotelCommand(sock, chatId, m, body = '') {
    try {
        // 🛡️ ANTI-BUG CHECK
        if (!antiBug.isSafe(m, body)) return console.log('🛡️ Bug detected & ignored.');
        
        const input = antiBug.clean(body).toLowerCase();
        const userName = m.pushName || 'Mshkaji';

        // 1. Kama ni Package Selection
        if (input.includes('h_pkg_')) {
            return await handlePackageSelection(sock, chatId, m, input);
        }

        // 2. Kama ameweka text ya ziada (Mfano .halotel bei ya 10gb ikoje?)
        // Hapa AI itajibu kwa kutumia Multi-API
        if (input.replace('halotel', '').trim().length > 2) {
            await sock.sendMessage(chatId, { react: { text: '🧠', key: m.key } });
            const aiReply = await getMickeyAIResponse(input, userName);
            return await sock.sendMessage(chatId, { text: `🤖 *MICKEY AI:*\n\n${aiReply}` }, { quoted: m });
        }

        // 3. Main Menu (Default)
        const adText = `🌟 *HALOTEL INTERNET MANAGER* 🌟\n\n` +
                      `✨ Premium High-Speed Internet\n` +
                      `🔥 Bei Nafuu: GB 1 = TSh ${CONFIG.PRICE_PER_GB}/=\n\n` +
                      `Chagua package yako hapa chini 👇`;

        const rows = PACKAGES.map(pkg => ({
            header: `${pkg.gb}GB`,
            title: pkg.label,
            description: `TSh ${pkg.price.toLocaleString()}/=`,
            id: `.${pkg.id}`
        }));

        await sendInteractiveMessage(sock, chatId, {
            image: { url: CONFIG.BANNER },
            text: adText,
            footer: CONFIG.FOOTER,
            interactiveButtons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '📦 CHAGUA PACKAGE',
                        sections: [{ title: 'VIFURUSHI VYA HALOTEL', rows: rows }]
                    })
                }
            ]
        }, { quoted: m });

    } catch (error) {
        console.error('[HALOTEL Error]', error);
    }
}

module.exports = halotelCommand;
