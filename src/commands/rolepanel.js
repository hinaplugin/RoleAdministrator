const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createRolePanelEmbed } = require('../utils/rolePanel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolepanel')
        .setDescription('指定したロールパネルを召喚・設置します')
        .addStringOption(option =>
            option.setName('panelname')
                .setDescription('召喚するパネルの名前')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
    async execute(interaction) {
        const panelName = interaction.options.getString('panelname');
        const config = interaction.client.config;
        const serverId = interaction.guild.id;
        
        // Check if server configuration exists
        if (!config.servers[serverId]) {
            await interaction.reply({ 
                content: 'このサーバーの設定が見つかりません。', 
                ephemeral: true 
            });
            return;
        }
        
        const serverConfig = config.servers[serverId];
        
        // Check if role panels exist
        if (!serverConfig.rolePanels || !serverConfig.rolePanels[panelName]) {
            const availablePanels = serverConfig.rolePanels ? Object.keys(serverConfig.rolePanels).join(', ') : 'なし';
            await interaction.reply({ 
                content: `パネル "${panelName}" が見つかりません。\n利用可能なパネル: ${availablePanels}`, 
                ephemeral: true 
            });
            return;
        }
        
        const panelData = serverConfig.rolePanels[panelName];
        
        // Check if role exists
        const role = interaction.guild.roles.cache.get(panelData.roleId);
        if (!role) {
            await interaction.reply({ 
                content: `ロール ID "${panelData.roleId}" が見つかりません。設定を確認してください。`, 
                ephemeral: true 
            });
            return;
        }
        
        // Create embed
        const embed = await createRolePanelEmbed(interaction.guild, panelData);
        
        // Send the panel
        const message = await interaction.reply({ 
            embeds: [embed],
            fetchReply: true
        });
        
        // Save channel and message IDs to config
        panelData.channelId = interaction.channel.id;
        panelData.messageId = message.id;
        
        // Save configuration
        interaction.client.saveConfig();
        
        console.log(`Role panel "${panelName}" deployed by ${interaction.user.tag} in ${interaction.guild.name}`);
    }
};