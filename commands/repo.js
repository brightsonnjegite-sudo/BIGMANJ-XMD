/**
 * repo.js - Repository Information (Simplified)
 * Shows GitHub repo info without complex interactive messages
 */
const axios = require('axios');

// Format date to readable format
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Get language color emoji
function getLanguageEmoji(language) {
    const emojis = {
        'JavaScript': '🟨',
        'TypeScript': '🔵',
        'Python': '🟦',
        'Java': '☕',
        'Go': '🔵',
        'Rust': '🦀',
        'PHP': '💜',
        'C++': '⚙️',
        'Shell': '💻'
    };
    return emojis[language] || '📝';
}

async function repoCommand(sock, chatId, message) {
    if (!sock || !chatId) return;

    try {
        // Send loading reaction
        await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });

        // Fetch repository data
        const repoRes = await axios.get('https://api.github.com/repos/Mickeydeveloper/Mickey-Glitch', {
            headers: { 'User-Agent': 'MickeyBot' }
        });

        const repo = repoRes.data;

        // Build repository information text
        const repoText = `✨ *${repo.name.toUpperCase()}*\n\n` +
            `👤 *Owner:* ${repo.owner.login}\n` +
            `⭐ *Stars:* ${repo.stargazers_count.toLocaleString()}\n` +
            `🍴 *Forks:* ${repo.forks_count.toLocaleString()}\n` +
            `👁️ *Watchers:* ${repo.watchers_count.toLocaleString()}\n` +
            `🐛 *Open Issues:* ${repo.open_issues_count}\n\n` +
            `${getLanguageEmoji(repo.language)} *Language:* ${repo.language || 'Not specified'}\n` +
            `📜 *License:* ${repo.license?.name || 'N/A'}\n` +
            `📅 *Last Updated:* ${formatDate(repo.updated_at)}\n\n` +
            `📝 *Description:*\n${repo.description || 'No description available'}\n\n` +
            `🔗 *Repository:* ${repo.html_url}\n\n` +
            `🌐 *Visit GitHub:* ${repo.html_url}\n` +
            `🐛 *Issues:* ${repo.html_url}/issues\n` +
            `👥 *Contributors:* ${repo.html_url}/graphs/contributors\n` +
            `📚 *Clone URL:* \`${repo.clone_url}\`\n\n` +
            `💡 *Type .menu to see all commands*`;

        // Send simple text message
        await sock.sendMessage(chatId, {
            text: repoText
        }, { quoted: message });

        // Send success reaction
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (err) {
        console.error('Repo Error:', err);

        // Send error message
        await sock.sendMessage(chatId, {
            text: `❌ *Error fetching repo data.*\n\n_${err.message}_`
        }, { quoted: message });

        // Send error reaction
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = repoCommand;
