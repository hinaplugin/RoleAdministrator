const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolebutton')
        .setDescription('指定したロール切り替えボタンパネルを送信・設置します')
        .addStringOption(option =>
            option.setName('buttonname')
                .setDescription('送信するボタンパネルの名前')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
    async execute(interaction) {
        const buttonName = interaction.options.getString('buttonname');
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
        
        // Check if role buttons exist
        if (!serverConfig.roleButtons || !serverConfig.roleButtons[buttonName]) {
            const availableButtons = serverConfig.roleButtons ? Object.keys(serverConfig.roleButtons).join(', ') : 'なし';
            await interaction.reply({ 
                content: `ボタン "${buttonName}" が見つかりません。\n利用可能なボタン: ${availableButtons}`, 
                ephemeral: true 
            });
            return;
        }
        
        const buttonData = serverConfig.roleButtons[buttonName];
        
        // Check if role exists
        const role = interaction.guild.roles.cache.get(buttonData.roleId);
        if (!role) {
            await interaction.reply({ 
                content: `ロール ID "${buttonData.roleId}" が見つかりません。設定を確認してください。`, 
                ephemeral: true 
            });
            return;
        }
        
        // Create buttons
        const joinButton = new ButtonBuilder()
            .setCustomId(`role_join_${buttonData.roleId}`)
            .setLabel(buttonData.joinLabel)
            .setStyle(ButtonStyle.Primary);
        
        const leaveButton = new ButtonBuilder()
            .setCustomId(`role_leave_${buttonData.roleId}`)
            .setLabel(buttonData.leaveLabel)
            .setStyle(ButtonStyle.Secondary);
        
        // Add emojis if specified
        if (buttonData.joinEmoji) {
            joinButton.setEmoji(buttonData.joinEmoji);
        }
        
        if (buttonData.leaveEmoji) {
            leaveButton.setEmoji(buttonData.leaveEmoji);
        }
        
        const row = new ActionRowBuilder()
            .addComponents(joinButton, leaveButton);
        
        // Send the message with buttons
        const message = await interaction.reply({ 
            content: buttonData.message,
            components: [row],
            fetchReply: true
        });
        
        // Save channel and message IDs to config
        buttonData.channelId = interaction.channel.id;
        buttonData.messageId = message.id;
        
        // Save configuration
        interaction.client.saveConfig();
        
        console.log(`Role button "${buttonName}" deployed by ${interaction.user.tag} in ${interaction.guild.name}`);
    }
};