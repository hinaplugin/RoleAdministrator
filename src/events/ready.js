const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        console.log(`Bot is running on ${client.guilds.cache.size} servers`);
        
        // Cache all guild members on startup
        console.log('Caching all guild members...');
        const startTime = Date.now();
        
        for (const guild of client.guilds.cache.values()) {
            try {
                await guild.members.fetch();
                console.log(`Cached ${guild.memberCount} members from ${guild.name}`);
            } catch (error) {
                console.error(`Failed to cache members from ${guild.name}:`, error);
            }
        }
        
        const endTime = Date.now();
        console.log(`Member caching completed in ${endTime - startTime}ms`);
        
        // Set bot status
        client.user.setPresence({
            activities: [{
                name: 'ロール管理',
                type: ActivityType.Competing
            }],
            status: 'online'
        });
    }
};