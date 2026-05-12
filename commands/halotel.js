/**
 * halotel.js - Mickey Glitch Business AI (Gifted-Btns Edition)
 * Kazi: Inatumia library ya gifted-btns kurusha buttons na flow kirahisi.
 */

const { sendInteractiveMessage } = require('gifted-btns');
const axios = require('axios');

const CONFIG = {
    PRICE_PER_GB: 1000,
    SELLER_NUMBER: '255615944741@s.whatsapp.net',
    BANNER: 'https://files.catbox.moe/ljabyq.png',
    FOOTER: '🚀 Powered by Mickey Glitch Tech',
};

const PACKAGES = [
    { gb: 10, price: 10000, label: 'Standard Pack', id: 'h_pkg_10' },
    { gb: 15, price: 15000, label: 'Bronze Pack',   id: 'h_pkg_15' },
    { gb: 25, price: 25000, label: 'Gold Pack',     id: 'h_pkg_25' }
];

async function halotelCommand(sock, chatId, m, body = '') {
    try {
        const userName = m.pushName || 'Mteja';
        const userJid = m.key.participant || m.key.remoteJid;

        // 1. TAMBUA INPUT
        const textMsg = (m.message?.conversation || m.message?.extendedTextMessage?.text || body || '').toLowerCase().trim();
        const flowResponse = m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;

        // 2. [HANDLING FLOW RESPONSE] - Mteja akishajaza fomu
        if (flowResponse) {
            const data = JSON.parse(flowResponse);
            const selectedId = data.package_id || data.slot_id;
            
            await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });

            return await sock.sendMessage(chatId, {
                text: `✨ *MICKEY BIZ ODA*\n\nSafi *${userName}*! Oda yako ya ${selectedId} imepokelewa.\n\n💳 *LIPA HAPA:* 0615944741 (Halotel)\nKisha tuma screenshot hapa chap! 🚀`
            }, { quoted: m });
        }

        // 3. [MAIN MENU] - Inaitwa na .halotel
        if (textMsg.startsWith('.halotel')) {
            await sock.sendMessage(chatId, { react: { text: '🛒', key: m.key } });

            // Kutumia gifted-btns kutuma Flow na Buttons nyingine
            const buttons = [
                {
                    name: "flow",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🛒 AGIZA BANDO",
                        flow_id: "615944741",
                        flow_action: "navigate",
                        flow_token: "mickey_v3",
                        flow_cta: "Fungua Fomu",
                        flow_action_payload: {
                            screen: "SELECT_PACKAGE",
                            data: { 
                                title: "Vifurushi vya Halotel",
                                items: PACKAGES.map(p => ({ id: p.id, title: p.label, description: `TSh ${p.price}` }))
                            }
                        }
                    })
                },
                {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                        display_text: "📋 Copy Namba ya Malipo",
                        copy_code: "0615944741"
                    })
                }
            ];

            return await sendInteractiveMessage(sock, chatId, {
                image: { url: CONFIG.BANNER },
                text: `Habari *${userName}*! Karibu Mickey Infor Tech.\n\nChagua bando lako hapa chini au copy namba ya malipo moja kwa moja. 👇`,
                footer: CONFIG.FOOTER,
                interactiveButtons: buttons
            }, { quoted: m });
        }

        // 4. [AI CONVERSATION]
        if (textMsg.length > 2 && !textMsg.startsWith('.')) {
            const bizPrompt = `Wewe ni Mickey Biz AI. Unauza bando (1GB=1000). Mteja anaitwa ${userName}. Jibu kishkaji.`;
            const res = await axios.get(`https://apiskeith.top/ai/gpt?q=${encodeURIComponent(bizPrompt + textMsg)}`);
            const aiReply = res.data.data || res.data.result || "Oya! Tumia .halotel kuona bando.";
            return await sock.sendMessage(chatId, { text: `💼 *MICKEY BIZ:* ${aiReply}` }, { quoted: m });
        }

    } catch (e) {
        console.error("Halotel Error:", e);
    }
}

module.exports = halotelCommand;
