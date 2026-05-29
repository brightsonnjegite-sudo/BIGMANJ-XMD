const { execSync } = require('child_process');
const path = require('path');
const axios = require('axios');

module.exports = {
  name: 'checkupdates',
  aliases: ['checkupdate'],
  category: 'owner',
  sudo: true,
  async execute(client, message, args) {
    try {
      // 1. Pata commit ya sasa (local) kwa kutumia git
      let currentSha;
      try {
        currentSha = execSync('git rev-parse HEAD', {
          encoding: 'utf8',
          cwd: path.join(__dirname, '..')
        }).trim();
        if (!currentSha.match(/^[a-f0-9]{40}$/)) throw new Error('Invalid commit hash');
      } catch (gitErr) {
        console.error('Git error:', gitErr.message);
        await message.reply('❌ Bot haikuwekwa kwa `git clone`. Tafadhali clone repo kwa git ili kutumia amri hii.');
        return;
      }

      // 2. Pata commit ya mwisho kutoka GitHub API
      const repoOwner = 'brightsonnjegite-sudo';
      const repoName = 'Mickey-Glitch';
      const branch = 'main'; // Ikiwa repo inatumia 'master', badilisha hapa

      const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/commits/${branch}`;
      const { data } = await axios.get(apiUrl, {
        headers: { 'User-Agent': 'WhatsAppBot-UpdateChecker' }
      });
      const latestSha = data.sha;

      // 3. Linganisha
      if (currentSha === latestSha) {
        await message.reply(`✅ Bot iko updated!\nToleo lako: \`${currentSha.slice(0, 7)}\``);
      } else {
        const compareUrl = `https://github.com/${repoOwner}/${repoName}/compare/${currentSha}...${latestSha}`;
        await message.reply(
          `🔄 *Update inapatikana!*\n\n` +
          `Toleo lako: \`${currentSha.slice(0, 7)}\`\n` +
          `Toleo jipya: \`${latestSha.slice(0, 7)}\`\n\n` +
          `📝 [Angalia mabadiliko](${compareUrl})\n\n` +
          `Ili kuboresha, tumia \`.pullupdate\` (kama ipo) au fanya \`git pull\` manually.`
        );
      }
    } catch (error) {
      console.error('Hitilafu ya kuangalia updates:', error);
      await message.reply('❌ Imeshindwa kuangalia updates. Tazama console kwa maelezo.');
    }
  }
};