const moment = require('moment-timezone');

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return moment(date).tz('Africa/Dar_es_Salaam').format('MMM D, YYYY');
}

async function repoCommand(sock, chatId, message) {
    const repoOwner = 'brightsonnjegite-sudo';
    const repoName = 'BIGMANJ-XMD';
    const repoUrl = `https://github.com/${repoOwner}/${repoName}`;
    const zipUrl = `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/main.zip`;

    // Loading reaction
    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

    let repoData = null;
    // Try to fetch with fetch (Node.js 18+)
    try {
        const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`);
        if (res.ok) repoData = await res.json();
    } catch (err) {
        console.log('Fetch error, using fallback data');
    }

    // If fetch fails or no data, use static fallback (based on your screenshot)
    let name, owner, stars, forks, watchers, openIssues, language, license, lastUpdated, description;
    if (repoData) {
        name = repoData.name;
        owner = repoData.owner.login;
        stars = repoData.stargazers_count;
        forks = repoData.forks_count;
        watchers = repoData.watchers_count;
        openIssues = repoData.open_issues_count;
        language = repoData.language || 'JavaScript';
        license = repoData.license ? repoData.license.name : 'N/A';
        lastUpdated = formatDate(repoData.updated_at);
        description = repoData.description || 'No description provided.';
    } else {
        // Fallback static data (from your screenshot)
        name = repoName;
        owner = repoOwner;
        stars = 1;
        forks = 0;
        watchers = 1;
        openIssues = 0;
        language = 'JavaScript';
        license = 'N/A';
        lastUpdated = formatDate(new Date().toISOString());
        description = 'No description available.';
    }

    const caption = `✨ *${name}*

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

    // Use native WhatsApp template buttons (no external libs)
    await sock.sendMessage(chatId, {
        text: caption,
        footer: 'BIGMANj DT Tech • Powered by Bigmanj',
        templateButtons: [
            { urlButton: { displayText: '🌐 OPEN REPOSITORY', url: repoUrl } },
            { urlButton: { displayText: '📦 DOWNLOAD ZIP', url: zipUrl } },
            { copyCodeButton: { displayText: '📋 COPY REPO LINK', copyCode: repoUrl } }
        ]
    }, { quoted: message });

    await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
}

module.exports = repoCommand;