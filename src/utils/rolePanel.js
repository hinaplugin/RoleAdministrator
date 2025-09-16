const { EmbedBuilder } = require('discord.js');
const { loadAllPanelsForGuild } = require('./panelStorage');

// サーバー内のすべてのロールパネルを更新する関数（特定のロールが変更された場合はそのパネルのみ）
async function updateRolePanels(client, guild, changedRoleIds = null) {
    const guildId = guild.id;
    
    // このサーバーのすべてのパネルを読み込み
    const panels = loadAllPanelsForGuild(guildId);
    
    if (Object.keys(panels).length === 0) {
        return;
    }
    
    // パネル更新前に最新のメンバーデータを取得
    try {
        await guild.members.fetch();
    } catch (error) {
        console.error('パネル更新用のサーバーメンバー取得エラー:', error);
    }
    
    for (const [panelName, panelData] of Object.entries(panels)) {
        // 特定のロールが指定されている場合、そのロールを含むパネルのみ更新
        if (changedRoleIds) {
            const panelRoleIds = panelData.roleIds || [];
            const hasChangedRole = changedRoleIds.some(roleId => panelRoleIds.includes(roleId));
            if (!hasChangedRole) {
                continue;
            }
        }
        
        if (panelData.channelId && panelData.messageId) {
            try {
                const channel = guild.channels.cache.get(panelData.channelId);
                if (!channel) {
                    console.error(`チャンネルが見つかりません: ${panelData.channelId}`);
                    continue;
                }
                
                const message = await channel.messages.fetch(panelData.messageId);
                if (!message) {
                    console.error(`メッセージが見つかりません: ${panelData.messageId}`);
                    continue;
                }
                
                // ボット権限の確認
                const botMember = guild.members.cache.get(guild.client.user.id);
                const channelPerms = channel.permissionsFor(botMember);
                const canSendMessages = channelPerms.has('SendMessages');
                const canEmbedLinks = channelPerms.has('EmbedLinks');
                
                if (!canSendMessages) {
                    console.error(`❌ チャンネル #${channel.name} (${channel.id}) でボットにメッセージ送信権限がありません`);
                    console.error(`チャンネルタイプ: ${channel.type}, 親カテゴリ: ${channel.parent?.name || 'なし'}`);
                    console.error(`権限 - 送信: ${canSendMessages}, 埋め込み: ${canEmbedLinks}`);
                    console.error('以下を確認してください:');
                    console.error('1. サーバー設定でのボットロール権限');
                    console.error('2. チャンネル固有の権限設定');
                    console.error('3. カテゴリチャンネルからの権限継承');
                    continue;
                }
                
                if (!canEmbedLinks) {
                    console.error(`❌ チャンネル #${channel.name} でボットに埋め込みリンク権限がありません`);
                    console.error('この権限がないとロールパネルが正常に表示されません。');
                    console.error('以下の場所でボットに「埋め込みリンク」権限を付与してください:');
                    console.error('1. サーバー設定 → ロール → ボットロール → 埋め込みリンク');
                    console.error('2. または チャンネル設定 → 権限 → ボット → 埋め込みリンク');
                    continue;
                }
                
                const embed = await createRolePanelEmbed(guild, panelData);
                await message.edit({ embeds: [embed] });
                console.log(`ロールパネル ${panelName} を ${guild.name} で更新しました`);
            } catch (error) {
                console.error(`ロールパネル ${panelName} の更新エラー:`, error);
            }
        }
    }
}

// ロールパネルのEmbed作成関数
async function createRolePanelEmbed(guild, panelData) {
    // すべてのサーバーメンバーをキャッシュに確保
    await guild.members.fetch();
    
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