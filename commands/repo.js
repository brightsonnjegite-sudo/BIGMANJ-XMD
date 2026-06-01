const os = require('os');
const axios = require('axios');
const { sendButtons } = require('gifted-btns');
const moment = require('moment-timezone');

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return moment(date).tz('Africa/Dar_es_Salaam').format('MMM D, YYYY');
}

async function repoCommand(sock, chatId, message) {
    try {
        const repoOwner = 'brightsonnjegite-sudo';
        const repoName = 'BIGMANJ-XMD';
        const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`;
        const zipUrl = `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/main.zip`;
        const repoUrl = `https://github.com/${repoOwner}/${repoName}`;

        // Show loading reaction
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // Fetch repo data from GitHub API
        const response = await axios.get(apiUrl);
        const repoData = response.data;

        // Extract repository details
        const repoNameDisplay = repoData.name;
        const owner = repoData.owner.login;
        const stars = repoData.stargazers_count;
        const forks = repoData.forks_count;
        const watchers = repoData.watchers_count;
        const openIssues = repoData.open_issues_count;
        const language = repoData.language;
        const license = repoData.license ? repoData.license.name : 'N/A';
        const lastUpdated = formatDate(repoData.updated_at);
        const description = repoData.description || 'No description provided.';

        // Construct stylish message
        const caption = `✨ *${repoNameDisplay}*

👤 *Owner:* ${owner}
⭐ *Stars:* ${stars}
🍴 *Forks:* ${forks}
👁️ *Watchers:* ${watchers}
🐛 *Open Issues:* ${openIssues}

🟨 *Language:* ${language}
📜 *License:* ${license}
📅 *Last Updated:* ${lastUpdated}

📝 *Description:*
${description}

💡 *Type .menu to see all commands*
> bigmanj tech™`;

        // Define the buttons
        const buttons = [
            { id: 'copy_repo_link', text: '📋 COPY REPO LINK' },
            { id: 'open_repo', text: '🌐 OPEN REPOSITORY' },
            { id: 'download_zip', text: '📦 DOWNLOAD ZIP' }
        ];

        // Send the message with buttons
        await sendButtons(sock, chatId, {
            title: '⚡ BIGMANj ENGINE',
            text: caption,
            footer: 'BIGMANj DT Tech • Powered by Bigmanj',
            buttons: buttons
        }, { quoted: message });

        // React with ✅ after sending
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Repo command error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *Failed to fetch repository data!*\nPlease check the repository URL or try again later.'
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = repoCommand;