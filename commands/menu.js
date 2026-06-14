const { generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysockets/baileys');

// Your Catbox images (add as many as you want)
const MENU_IMAGES = [
    'https://files.catbox.moe/uii8bi.jpg',
    'https://files.catbox.moe/69csjf.jpg',
    'https://files.catbox.moe/wz28nv.jpg',
    'https://files.catbox.moe/07brl4.jpg',
    'https://files.catbox.moe/dhl8dp.jpg',
    'https://files.catbox.moe/n6adzs.jpg',
    'https://files.catbox.moe/gom02i.jpg',
    'https://files.catbox.moe/vvt57n.jpg',
    'https://files.catbox.moe/sp5pe9.jpg',
    'https://files.catbox.moe/x91kwx.jpg',
    'https://files.catbox.moe/8lz3ku.jpg',
    'https://files.catbox.moe/9yvg4v.jpg',
    'https://files.catbox.moe/1z5alt.jpg',
    'https://files.catbox.moe/5rsxjx.jpg',
    'https://files.catbox.moe/ke4n31.jpg',
    'https://files.catbox.moe/0s1yur.jpg',
    'https://files.catbox.moe/q01e2v.jpg',
    'https://files.catbox.moe/e0esva.jpg',
    'https://files.catbox.moe/x39ule.jpg'
];

// Map image index to mini‑menu command (adjust to your actual commands)
const MENU_COMMANDS = [
    '.menu-general',
    '.menu-group',
    '.menu-security',
    '.menu-ai',
    '.menu-download',
    '.menu-effects',
    '.menu-owner',
    '.menu-settings',
    '.menu-tools',
    '.menu-fun',
    '.menu-automation',
    '.menu-all',
    '.menu-general',
    '.menu-group',
    '.menu-security',
    '.menu-ai',
    '.menu-download',
    '.menu-effects',
    '.menu-owner'
];

async function menuHandler(sock, chatId, m) {
    const text = getMessageText(m).trim().toLowerCase();
    if (text !== '.menu') return;

    // Prepare each card (image + button)
    const cards = [];
    for (let i = 0; i < MENU_IMAGES.length; i++) {
        const imageUrl = MENU_IMAGES[i];
        const cmd = MENU_COMMANDS[i % MENU_COMMANDS.length];
        
        // Upload image to WhatsApp servers
        const { imageMessage } = await prepareWAMessageMedia(
            { image: { url: imageUrl } },
            { upload: sock.waUploadToServer }
        );
        
        cards.push({
            body: { text: `📌 *Card ${i+1}*` },
            footer: { text: `Tap button to open menu` },
            header: { hasMedia: true, imageMessage },
            nativeFlowMessage: {
                buttons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: `📂 ${cmd.replace('.menu-', '').toUpperCase()}`,
                            id: cmd
                        })
                    }
                ]
            }
        });
    }

    // Build the carousel message
    const carouselMessage = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { text: '✨ *BIGMANJ BOT V3 MENU* ✨' },
                    footer: { text: '👑 Swipe to see all options • © bigmanj tech ™ with ♥︎' },
                    header: { title: '🎠 CAROUSEL MENU' },
                    nativeFlowMessage: {
                        childNativeFlowMessages: cards,
                        buttons: [] // optional global button
                    }
                }
            }
        }
    };

    await sock.sendMessage(chatId, carouselMessage, { quoted: m });
    await sock.sendMessage(chatId, { react: { text: '🖼️', key: m.key } });
}

// Helper to extract message text (keep your existing)
function getMessageText(m) {
    if (m.message?.conversation) return m.message.conversation;
    if (m.message?.extendedTextMessage?.text) return m.message.extendedTextMessage.text;
    return '';
}

module.exports = menuHandler;