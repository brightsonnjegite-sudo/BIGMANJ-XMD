/**
 * .stats command - Show system statistics
 * Usage: .stats
 */

const os = require('os');
const { getStats } = require('../main');

module.exports = async (sock, chatId, senderId, args, m) => {
    try {
        // Get system stats
        const stats = getStats();
        
        // Get memory usage
        const memUsage = process.memoryUsage();
        const ramMB = (memUsage.rss / 1024 / 1024).toFixed(2);
        const heapMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
        
        // Get uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        // Build stats message
        const statsMsg = `
🤖 *MICKEY GLITCH SYSTEM STATS*

📊 *Registry Status:*
├ Commands: ${stats.commands} loaded
├ Libraries: ${stats.libraries} loaded
├ Data Files: ${stats.dataFiles} registered
└ Handlers: ${stats.specialHandlers} active

💾 *Memory Usage:*
├ Total RAM: ${ramMB} MB
├ Heap Used: ${heapMB} MB
└ System Free: ${(os.freemem() / 1024 / 1024).toFixed(2)} MB

⏱️ *Uptime:*
├ ${days}d ${hours}h ${minutes}m ${seconds}s
└ Updated: ${new Date(stats.timestamp).toLocaleTimeString()}

🔧 *System:*
├ Node Version: ${process.version}
├ Platform: ${os.platform()}
└ CPU Cores: ${os.cpus().length}

✅ *Status:* All Systems Operational
`;

        await sock.sendMessage(chatId, { text: statsMsg.trim() });
        
    } catch (e) {
        console.error('Stats error:', e);
        await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` });
    }
};
