const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createRolePanelEmbed } = require('../utils/rolePanel');
const { savePanelData } = require('../utils/panelStorage');

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
    
    // Validate panel name (should be filesystem-safe)
    if (!/^[a-zA-Z0-9_-]+$/.test(panelName)) {
        await interaction.reply({
            content: 'パネル名は英数字、ハイフン、アンダースコアのみ使用できます。',
            ephemeral: true
        });
        return;
    }
    
    // Parse role mentions and IDs
    const roleIds = parseRoles(rolesInput, interaction.guild);
    
    if (roleIds.length === 0) {
        await interaction.reply({
            content: '有効なロールが見つかりません。ロールメンションまたはロールIDを指定してください。',
            ephemeral: true
        });
        return;
    }
    
    // Check if all roles exist
    const invalidRoles = roleIds.filter(roleId => !interaction.guild.roles.cache.get(roleId));
    if (invalidRoles.length > 0) {
        await interaction.reply({
            content: `以下のロールIDが見つかりません: ${invalidRoles.join(', ')}`,
            ephemeral: true
        });
        return;
    }
    
    // Create panel data
    const panelData = {
        channelId: interaction.channel.id,
        messageId: null, // Will be set after message is sent
        roleIds: roleIds,
        title: title,
        message: message,
        showCount: showCount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Create embed
    const embed = await createRolePanelEmbed(interaction.guild, panelData);
    
    // Send the panel
    const sentMessage = await interaction.reply({
        embeds: [embed],
        fetchReply: true
    });
    
    // Update panel data with message ID
    panelData.messageId = sentMessage.id;
    
    // Save panel data to file
    const saved = savePanelData(guildId, panelName, panelData);
    
    if (saved) {
        console.log(`Role panel "${panelName}" created by ${interaction.user.tag} in ${interaction.guild.name}`);
        console.log(`Roles: ${roleIds.map(id => interaction.guild.roles.cache.get(id)?.name || id).join(', ')}`);
    } else {
        await interaction.followUp({
            content: '⚠️ パネルは作成されましたが、データの保存に失敗しました。自動更新が動作しない可能性があります。',
            ephemeral: true
        });
    }
}

function parseRoles(rolesInput, guild) {
    const roleIds = [];
    
    // Split by spaces and process each part
    const parts = rolesInput.trim().split(/\s+/);
    
    for (const part of parts) {
        // Check if it's a role mention (<@&id>)
        const mentionMatch = part.match(/^<@&(\d+)>$/);
        if (mentionMatch) {
            roleIds.push(mentionMatch[1]);
            continue;
        }
        
        // Check if it's a role ID (numeric)
        if (/^\d+$/.test(part)) {
            roleIds.push(part);
            continue;
        }
        
        // Try to find role by name
        const roleByName = guild.roles.cache.find(role => 
            role.name.toLowerCase() === part.toLowerCase()
        );
        if (roleByName) {
            roleIds.push(roleByName.id);
        }
    }
    
    // Remove duplicates
    return [...new Set(roleIds)];
}