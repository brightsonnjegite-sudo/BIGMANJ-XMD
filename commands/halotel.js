/**
 * halotel.js - Mickey Glitch Business AI (Flow Version 2026)
 * Kazi: Kutumia WhatsApp Flows kukusanya oda za bando kitalaamu zaidi.
 */

const axios = require('axios');

const CONFIG = {
    PRICE_PER_GB: 1000,
    SELLER_NUMBER: '255615944741@s.whatsapp.net',
    BANNER: 'https://files.catbox.moe/ljabyq.png',
    FOOTER: '🚀 Powered by Mickey Glitch Tech',
};

// ────────────────────────────────────────────────
// [NATIVE FLOW GENERATOR]
// ────────────────────────────────────────────────
async function sendHalotelFlow(sock, chatId, m, userName) {
    const flowMsg = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: {
                        title: `Habari ${userName}, Karibu Mickey Biz!`,
                        hasMediaAttachment: true,
                        imageMessage: (await sock.prepareWAMessageMedia({ image: { url: CONFIG.BANNER } }, { upload: sock.waUploadToServer })).imageMessage
                    },
                    body: {
                        text: "Jaza fomu fupi hapa chini ili kukamilisha oda yako ya bando la Halotel chap!"
                    },
                    footer: {
                        text: CONFIG.FOOTER
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "flow",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🛒 Agiza Bando Sasa",
                                    flow_id: "74839201", // Id ya flow yako (Create via Meta Business Suite)
                                    flow_action: "navigate",
                                    flow_token: "mickey_glitch_v3",
                                    flow_cta: "Fungua Fomu",
                                    flow_action_payload: {
                                        screen: "SELECT_PACKAGE",
                                        data: {
                                            packages: [
                                                { id: "10", title: "10GB - TSh 10,000" },
                                                { id: "15", title: "15GB - TSh 15,000" },
                                                { id: "25", title: "25GB - TSh 25,000" }
                                            ]
                                        }
                                    }
                                })
                            }
                        ]
                    }
                }
            }
        }
    };

    return await sock.relayMessage(chatId, flowMsg, { messageId: m.key.id });
}

// ────────────────────────────────────────────────
// [MAIN COMMAND & HANDLER]
// ────────────────────────────────────────────────
async function halotelCommand(sock, chatId, m, body = '') {
    try {
        const userName = m.pushName || 'Mteja';
        const userJid = m.key.participant || m.key.remoteJid;

        // TAFUTA INPUT: Kwenye Flow, data inarudi kama 'interactive_response'
        let input = (body || '').toLowerCase().trim();
        let flowResponse = m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;

        // 1. [FLOW RESPONSE HANDLER] - Hapa ndipo oda inasomwa ikitoka kwenye fomu
        if (flowResponse) {
            const data = JSON.parse(flowResponse);
            const selectedGb = data.package_id; // Inategemea na 'id' kwenye Flow Designer
            const amount = selectedGb * CONFIG.PRICE_PER_GB;

            await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });

            // Arifu muuzaji oda imekuja toka kwenye Flow
            await sock.sendMessage(CONFIG.SELLER_NUMBER, { 
                text: `🔔 *ODA MPYA (FLOW):*\n👤 Mteja: @${userJid.split('@')[0]}\n📦 Bando: ${selectedGb}GB\n💰 Kiasi: TSh ${amount.toLocaleString()}`,
                mentions: [userJid]
            });

            return await sock.sendMessage(chatId, {
                text: `Safi sana *${userName}*! Umepiga oda ya ${selectedGb}GB.\n\n💳 *LIPA HAPA:*\nHalotel: 0615944741\nAzamPesa: 1615944741\n\nKisha tuma screenshot hapa nikuwashie bando chap! 🚀`
            }, { quoted: m });
        }

        // 2. [OPEN FLOW FORM] - Akipiga .halotel
        if (input.startsWith('.halotel')) {
            return await sendHalotelFlow(sock, chatId, m, userName);
        }

        // 3. [AI CONVERSATION] - Maswali mengine
        if (input.length > 2 && !input.startsWith('.')) {
            // Hapa unaweza kuendelea kutumia askMickeyBiz yako ya mwanzo
            const response = "Oya! Tumia command ya *.halotel* ili uone fomu ya bando kitalaamu zaidi na upige oda chap.";
            return await sock.sendMessage(chatId, { text: `💼 *MICKEY BIZ:* ${response}` }, { quoted: m });
        }

    } catch (e) { 
        console.error('Flow Error:', e); 
    }
}

module.exports = halotelCommand;
