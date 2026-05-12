/**
 * halotel.js - Mickey Glitch Business AI (All-in-One Version)
 * Kazi: Inashughulikia .halotel na kurespond kwa h_pkg zote hapa hapa.
 */

const { sendInteractiveMessage } = require('gifted-btns');
const axios = require('axios');

const CONFIG = {
    PRICE_PER_GB: 1000,
    SELLER_NUMBER: '255615944741@s.whatsapp.net',
    BANNER: 'https://files.catbox.moe/ljabyq.png',
    FOOTER: '🚀 Powered by Mickey Glitch Tech',
    PAYMENT_NO: '0615944741'
};

// List ya packages zote
const PACKAGES = [
    { gb: 10, label: 'Standard Pack', id: 'h_pkg_10' },
    { gb: 15, label: 'Bronze Pack',   id: 'h_pkg_15' },
    { gb: 20, label: 'Silver Pack',   id: 'h_pkg_20' },
    { gb: 25, label: 'Gold Pack',     id: 'h_pkg_25' },
    { gb: 50, label: 'Business Pack', id: 'h_pkg_50' }
];

async function askMickeyBiz(query, userName, context = "") {
    try {
        const bizPrompt = `Wewe ni Mickey Biz AI. Unauza bando la Halotel (1GB=1000). Mteja ni ${userName}. Jibu kishkaji sana (Bongo Slang). Context: ${context}`;
        const res = await axios.get(`https://apiskeith.top/ai/gpt?q=${encodeURIComponent(bizPrompt + query)}`);
        return res.data.data || res.data.result || "Lipia bando mwanangu tuwashe mitambo.";
    } catch (e) { return "Nipo hapa! Lipia chap nikuwashie bando."; }
}

async function halotelCommand(sock, chatId, m, body = '') {
    try {
        const userName = m.pushName || 'Mteja';
        const userJid = m.key.participant || m.key.remoteJid;

        // 1. TAMBUA INPUT (Text au Button/List ID)
        const textMsg = (m.message?.conversation || m.message?.extendedTextMessage?.text || body || '').toLowerCase().trim();
        
        // Hii inakamata ID ya bando alilochagua mteja (kama h_pkg_20 kwenye picha yako)
        const selectedId = m.message?.listResponseMessage?.singleSelectReply?.selectedRowId || 
                           m.message?.buttonsResponseMessage?.selectedButtonId || '';

        // 2. [ALL-IN-ONE PACKAGE HANDLER] - Hapa ndipo h_pkg zote zinashughulikiwa
        if (selectedId.startsWith('h_pkg_')) {
            const gbValue = parseInt(selectedId.replace('h_pkg_', ''));
            const pkg = PACKAGES.find(p => p.gb === gbValue);
            const totalPrice = gbValue * CONFIG.PRICE_PER_GB;

            await sock.sendMessage(chatId, { react: { text: '⏳', key: m.key } });

            // AI anatoa maelekezo kulingana na bando lililochaguliwa
            const aiInstruction = await askMickeyBiz(`Mteja kachagua ${gbValue}GB. Mpe maelekezo ya kulipa TSh ${totalPrice}.`, userName, "Hatua ya malipo.");

            const paymentButtons = [
                {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                        display_text: `📋 Copy No: ${CONFIG.PAYMENT_NO}`,
                        copy_code: CONFIG.PAYMENT_NO
                    })
                }
            ];

            return await sendInteractiveMessage(sock, chatId, {
                text: `✨ *MICKEY BIZ - ODA YAKO*\n\n${aiInstruction}\n\n📊 *DATA:* ${gbValue}GB\n💰 *BEI:* TSh ${totalPrice.toLocaleString()}\n📌 *MTANDAO:* Halotel\n\nUkishalipa, tuma screenshot ya muamala hapa kisha utatumiwa bando lako muda huo huo! 🚀`,
                footer: CONFIG.FOOTER,
                interactiveButtons: paymentButtons
            }, { quoted: m });
        }

        // 3. [MAIN MENU] - Inaitwa na .halotel
        if (textMsg.startsWith('.halotel')) {
            await sock.sendMessage(chatId, { react: { text: '🛒', key: m.key } });

            const rows = PACKAGES.map(p => ({
                header: `${p.gb}GB`,
                title: p.label,
                description: `TSh ${(p.gb * CONFIG.PRICE_PER_GB).toLocaleString()}`,
                id: p.id
            }));

            return await sendInteractiveMessage(sock, chatId, {
                image: { url: CONFIG.BANNER },
                text: `Mambo vipi *${userName}*! 👋\n\nNaitwa Mickey Biz AI. Chagua bando unalotaka hapa chini nikupe namba ya kulipia chap! 👇`,
                footer: CONFIG.FOOTER,
                interactiveButtons: [{
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "🛒 ORODHA YA VIFURUSHI",
                        sections: [{ title: "HALOTEL BANDO", rows: rows }]
                    })
                }]
            }, { quoted: m });
        }

        // 4. [GENERAL AI CHAT]
        if (textMsg.length > 2 && !textMsg.startsWith('.')) {
            const aiReply = await askMickeyBiz(textMsg, userName, "Mteja anapiga stori za kawaida.");
            return await sock.sendMessage(chatId, { text: `💼 *MICKEY BIZ:* ${aiReply}` }, { quoted: m });
        }

    } catch (e) {
        console.error("Halotel Command Error:", e);
    }
}

module.exports = halotelCommand;
