const { Events, ActivityType, ChannelType } = require('discord.js');

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
                // メンバーキャッシュ
                await guild.members.fetch({ timeout: 60000 });
                console.log(`Cached ${guild.memberCount} members from ${guild.name}`);

                // チャンネルキャッシュ（ギルド取得時に自動キャッシュされるが明示的に取得）
                await guild.channels.fetch();
                console.log(`Cached ${guild.channels.cache.size} channels from ${guild.name}`);

                // スレッド対応チャンネルのみをフィルタリング
                const threadSupportedChannels = guild.channels.cache.filter(channel =>
                    channel.type === ChannelType.GuildForum ||
                    channel.type === ChannelType.GuildText ||
                    channel.type === ChannelType.GuildAnnouncement
                );

                // フォーラムとテキストチャンネルのスレッドをキャッシュ
                let totalThreads = 0;
                for (const channel of threadSupportedChannels.values()) {
                    try {
                        // アクティブなスレッドを取得
                        const activeThreads = await channel.threads.fetchActive();
                        totalThreads += activeThreads.threads.size;

                        // アーカイブされたスレッドを取得（公開）
                        const archivedPublic = await channel.threads.fetchArchived({ type: 'public' });
                        totalThreads += archivedPublic.threads.size;

                        // アーカイブされたスレッドを取得（プライベート）- 権限がある場合のみ
                        try {
                            const archivedPrivate = await channel.threads.fetchArchived({ type: 'private' });
                            totalThreads += archivedPrivate.threads.size;
                        } catch (privError) {
                            // プライベートスレッドの権限がない場合はスキップ
                        }
                    } catch (threadError) {
                        // 個別チャンネルのスレッド取得エラーは無視して続行
                    }
                }

                if (totalThreads > 0) {
                    console.log(`Cached ${totalThreads} threads from ${guild.name}`);
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