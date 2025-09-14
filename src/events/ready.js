const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        console.log(`Bot is running on ${client.guilds.cache.size} servers`);
        
        // Set bot status
        client.user.setPresence({
            activities: [{
                name: 'ロール管理',
                type: 0
            }],
            status: 'online'
        });
    }
};