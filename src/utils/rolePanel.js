const { EmbedBuilder } = require('discord.js');
const { loadAllPanelsForGuild, savePanelData } = require('./panelStorage');

// サーバー内のすべてのロールパネルを更新する関数（特定のロールが変更された場合はそのパネルのみ）
async function updateRolePanels(guild, changedRoleIds = null) {
    const guildId = guild.id;

    // このサーバーのすべてのパネルを読み込み
    const panels = loadAllPanelsForGuild(guildId);

    if (Object.keys(panels).length === 0) {
        return;
    }

    // 更新が必要なパネルを事前にフィルタリング
    const panelsToUpdate = Object.entries(panels).filter(([panelName, panelData]) => {
        if (!changedRoleIds) {
            return true; // すべてのパネルを更新
        }
        const panelRoleIds = panelData.roleIds || [];
        return changedRoleIds.some(roleId => panelRoleIds.includes(roleId));
    });

    // 更新対象のパネルがない場合は終了
    if (panelsToUpdate.length === 0) {
        return;
    }

    for (const [panelName, panelData] of panelsToUpdate) {
        
        if (panelData.channelId && panelData.messageId) {
            try {
                const channel = guild.channels.cache.get(panelData.channelId);
                if (!channel) {
                    console.error(`チャンネルが見つかりません: ${panelData.channelId}`);
                    continue;
                }
                
                const message = await channel.messages.fetch(panelData.messageId);

                console.log("channel: " + panelData.channelId);
                console.log("message: " + message.thread);
                if (!message) {
                    console.error(`メッセージが見つかりません: ${panelData.messageId}`);
                    continue;
                }

                // ボット権限の確認（フォーラムチャンネルの場合はスレッドレベルで確認）
                const targetChannel = message.thread || channel;
                const channelPerms = targetChannel.permissionsFor(guild.members.me);

                // スレッド（フォーラム投稿）の場合はSendMessagesInThreadsをチェック
                // チャンネルタイプ11はフォーラム投稿（スレッド）
                const isThread = targetChannel.type === 11 || message.thread !== null;
                const hasMessagePermission = isThread
                    ? channelPerms.has('SendMessagesInThreads')
                    : channelPerms.has('SendMessages');

                if (!hasMessagePermission) {
                    const permissionName = isThread ? 'SendMessagesInThreads' : 'SendMessages';
                    console.error(`❌ チャンネル #${targetChannel.name} でボットに${permissionName}権限がありません`);
                    continue;
                }

                if (!channelPerms.has('EmbedLinks')) {
                    console.error(`❌ チャンネル #${targetChannel.name} でボットに埋め込みリンク権限がありません`);
                    continue;
                }
                
                const embed = await createRolePanelEmbed(guild, panelData);

                // スレッドがアーカイブされている場合はアンアーカイブ
                if (message.thread && message.thread.archived) {
                    console.log("thread archived");
                    try {
                        await message.thread.edit({ archived: false });
                        console.log(`スレッド ${message.thread.name} をアンアーカイブしました`);
                    } catch (archiveError) {
                        console.error(`スレッドのアンアーカイブに失敗:`, archiveError);
                        continue;
                    }
                }

                await message.edit({ embeds: [embed] });

                // パネルデータのupdatedAtを更新
                savePanelData(guildId, panelName, panelData);

                console.log(`ロールパネル ${panelName} を ${guild.name} で更新しました`);
            } catch (error) {
                console.error(`ロールパネル ${panelName} の更新エラー:`, error);
            }
        }
    }
}

// ロールパネルのEmbed作成関数
async function createRolePanelEmbed(guild, panelData) {
    // メンバーデータはキャッシュから使用（既にfetch済みを想定）

    // パネルデータからロールIDを取得
    const roleIds = panelData.roleIds || [];

    // すべてのロールを取得してEmbedの色を決定
    const roles = roleIds.map(roleId => guild.roles.cache.get(roleId)).filter(role => role);
    const embedColor = roles.find(role => role.color !== 0)?.color || 0x0099FF;

    const embed = new EmbedBuilder()
        .setTitle(panelData.title)
        .setColor(embedColor);
    
    // ロールパネル全体をdescriptionに表示
    let description = '';

    if (roles.length === 0) {
        description = '対象ロールが設定されていません。';
    } else {
        // いずれかのロールにメンバーがいるかチェック
        const hasAnyMembers = roles.some(role =>
            guild.members.cache.some(member => member.roles.cache.has(role.id))
        );

        if (!hasAnyMembers) {
            // 対象ロール一覧のみ表示
            const roleList = roles.map(role => `## <@&${role.id}>`).join('\n');
            description = `${roleList}\n\nこのロールを持っているメンバーはいません。`;
        } else {
            // 各ロールとそのメンバーを表示
            const roleSections = [];

            for (const role of roles) {
                const roleMembers = guild.members.cache.filter(member =>
                    member.roles.cache.has(role.id)
                );

                if (roleMembers.size > 0) {
                    const memberList = roleMembers.map(member => `${member}`).join(' ');
                    let roleSection = `## <@&${role.id}>\n${memberList}`;

                    if (panelData.showCount) {
                        roleSection += `\n\n**メンバー数:** ${roleMembers.size}`;
                    }

                    roleSections.push(roleSection);
                } else {
                    // メンバーがいないロールも表示
                    roleSections.push(`## <@&${role.id}>\nメンバーなし`);
                }
            }

            description = roleSections.join('\n\n');
        }
    }

    // Discordのdescription制限は4096文字
    if (description.length > 4096) {
        description = description.substring(0, 4093) + '...';
    }

    embed.setDescription(description);
    
    embed.setTimestamp();
    
    return embed;
}

module.exports = {
    updateRolePanels,
    createRolePanelEmbed
};