const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createRolePanelEmbed } = require('../utils/rolePanel');
const { isPanelNameExists, savePanelData } = require('../utils/panelStorage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolepanel')
        .setDescription('ロールパネルを作成・設置します')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('新しいロールパネルを作成します')
                .addStringOption(option =>
                    option.setName('roles')
                        .setDescription('対象ロール（複数の場合はスペース区切り）')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('パネル名（ファイル名として使用）')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('パネルのタイトル')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('パネルの説明文')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('showcount')
                        .setDescription('メンバー数を表示するか（デフォルト: true）')
                        .setRequired(false)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'create') {
            await handleCreateCommand(interaction);
        }
    }
};

async function handleCreateCommand(interaction) {
    const rolesInput = interaction.options.getString('roles');
    const panelName = interaction.options.getString('name');
    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const showCount = interaction.options.getBoolean('showcount') ?? true;
    
    const guildId = interaction.guild.id;
    
    // パネル名の検証（ファイルシステム安全な文字のみ）
    if (!/^[a-zA-Z0-9_-]+$/.test(panelName)) {
        await interaction.reply({
            content: 'パネル名は英数字、ハイフン、アンダースコアのみ使用できます。',
            ephemeral: true
        });
        return;
    }

    // パネル名の重複チェック
    if (isPanelNameExists(guildId, panelName)) {
        await interaction.reply({
            content: `パネル名 "${panelName}" は既に使用されています。別の名前を指定してください。`,
            ephemeral: true
        });
        return;
    }
    
    // ロールメンションとIDを解析
    const roleIds = parseRoles(rolesInput, interaction.guild);
    
    if (roleIds.length === 0) {
        await interaction.reply({
            content: '有効なロールが見つかりません。ロールメンションまたはロールIDを指定してください。',
            ephemeral: true
        });
        return;
    }
    
    // すべてのロールが存在するかチェック
    const invalidRoles = roleIds.filter(roleId => !interaction.guild.roles.cache.get(roleId));
    if (invalidRoles.length > 0) {
        await interaction.reply({
            content: `以下のロールIDが見つかりません: ${invalidRoles.join(', ')}`,
            ephemeral: true
        });
        return;
    }
    
    // パネルデータを作成
    const panelData = {
        channelId: interaction.channel.id,
        messageId: null, // メッセージ送信後に設定
        roleIds: roleIds,
        title: title,
        message: message,
        showCount: showCount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Embedを作成
    const embed = await createRolePanelEmbed(interaction.guild, panelData);
    
    // パネルを送信
    const sentMessage = await interaction.reply({
        embeds: [embed],
        fetchReply: true
    });
    
    // メッセージIDでパネルデータを更新
    panelData.messageId = sentMessage.id;
    
    // パネルデータをファイルに保存
    const saved = savePanelData(guildId, panelName, panelData);
    
    if (saved) {
        console.log(`ロールパネル "${panelName}" を ${interaction.user.tag} が ${interaction.guild.name} で作成しました`);
        console.log(`ロール: ${roleIds.map(id => interaction.guild.roles.cache.get(id)?.name || id).join(', ')}`);
    } else {
        await interaction.followUp({
            content: '⚠️ パネルは作成されましたが、データの保存に失敗しました。自動更新が動作しない可能性があります。',
            ephemeral: true
        });
    }
}

function parseRoles(rolesInput, guild) {
    const roleIds = [];
    
    // スペースで分割して各部分を処理
    const parts = rolesInput.trim().split(/\s+/);
    
    for (const part of parts) {
        // ロールメンション (<@&id>) かチェック
        const mentionMatch = part.match(/^<@&(\d+)>$/);
        if (mentionMatch) {
            roleIds.push(mentionMatch[1]);
            continue;
        }
        
        // ロールID（数字）かチェック
        if (/^\d+$/.test(part)) {
            roleIds.push(part);
            continue;
        }
        
        // ロール名でロールを検索
        const roleByName = guild.roles.cache.find(role => 
            role.name.toLowerCase() === part.toLowerCase()
        );
        if (roleByName) {
            roleIds.push(roleByName.id);
        }
    }
    
    // 重複を除去
    return [...new Set(roleIds)];
}