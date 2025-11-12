const { Events, ActivityType } = require('discord.js');
const { loadAllPanelsForGuild, loadAllButtonsForGuild } = require('../utils/panelStorage');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        console.log(`Bot is running on ${client.guilds.cache.size} servers`);

        // Cache all guild members, channels on startup
        console.log('Caching all guild members and channels...');
        const startTime = Date.now();

        // すべてのサーバーを並列処理でキャッシュ
        const cachePromises = Array.from(client.guilds.cache.values()).map(async (guild) => {
            try {
                // メンバーキャッシュ（ロールパネル表示に必要）
                await guild.members.fetch({ timeout: 60000 });
                console.log(`Cached ${guild.memberCount} members from ${guild.name}`);

                // パネルとボタンのデータを読み込んで、使用されているチャンネルIDを取得
                const panels = loadAllPanelsForGuild(guild.id);
                const buttons = loadAllButtonsForGuild(guild.id);

                const usedChannelIds = new Set();

                // パネルが設置されているチャンネルIDを収集
                Object.values(panels).forEach(panel => {
                    if (panel.channelId) {
                        usedChannelIds.add(panel.channelId);
                    }
                });

                // ボタンが設置されているチャンネルIDを収集
                Object.values(buttons).forEach(button => {
                    if (button.channelId) {
                        usedChannelIds.add(button.channelId);
                    }
                });

                // 使用されているチャンネルとスレッドのみを並列でキャッシュ
                const channelFetchPromises = Array.from(usedChannelIds).map(async (channelId) => {
                    try {
                        // チャンネルまたはスレッドを取得（client.channels.fetchでスレッドも取得可能）
                        const channel = await client.channels.fetch(channelId).catch(() => null);

                        if (channel) {
                            // スレッドの場合は親チャンネルもキャッシュ
                            if (channel.isThread() && channel.parentId) {
                                await client.channels.fetch(channel.parentId).catch(() => null);
                                return { type: 'thread', found: true };
                            }
                            return { type: 'channel', found: true };
                        }

                        return { type: 'none', found: false };
                    } catch (fetchError) {
                        // 個別チャンネル取得エラーは無視
                        return { type: 'none', found: false };
                    }
                });

                // すべてのチャンネル取得が完了するまで待機
                const results = await Promise.all(channelFetchPromises);
                const cachedChannels = results.filter(r => r.type === 'channel' && r.found).length;
                const cachedThreads = results.filter(r => r.type === 'thread' && r.found).length;

                if (cachedChannels > 0 || cachedThreads > 0) {
                    console.log(`Cached ${cachedChannels} channels and ${cachedThreads} threads from ${guild.name}`);
                }

            } catch (error) {
                console.error(`Failed to cache data from ${guild.name}:`, error);
            }
        });

        // すべてのキャッシュ処理が完了するまで待機
        await Promise.all(cachePromises);

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