const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        console.log(`Bot is running on ${client.guilds.cache.size} servers`);

        // Cache all guild members, channels on startup
        console.log('Caching all guild members and channels...');
        const startTime = Date.now();

        for (const guild of client.guilds.cache.values()) {
            try {
                // メンバーキャッシュ
                await guild.members.fetch({ timeout: 60000 });
                console.log(`Cached ${guild.memberCount} members from ${guild.name}`);

                // チャンネルキャッシュ（ギルド取得時に自動キャッシュされるが明示的に取得）
                await guild.channels.fetch({ timeout: 60000});
                console.log(`Cached ${guild.channels.cache.size} channels from ${guild.name}`);

            } catch (error) {
                console.error(`Failed to cache data from ${guild.name}:`, error);
            }
        }

        const endTime = Date.now();
        console.log(`Caching completed in ${endTime - startTime}ms`);
        
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