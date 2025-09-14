const { Events, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            // Check if user has server management permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                await interaction.reply({ 
                    content: 'このコマンドを使用するにはサーバー管理権限が必要です。', 
                    ephemeral: true 
                });
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Error executing command:', error);
                const errorMessage = 'コマンドの実行中にエラーが発生しました。';
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            }
        } else if (interaction.isButton()) {
            // Handle button interactions for role buttons
            const customId = interaction.customId;
            
            if (customId.startsWith('role_join_') || customId.startsWith('role_leave_')) {
                const action = customId.startsWith('role_join_') ? 'join' : 'leave';
                const roleId = customId.split('_')[2];
                
                try {
                    const role = interaction.guild.roles.cache.get(roleId);
                    
                    if (!role) {
                        await interaction.reply({ 
                            content: 'ロールが見つかりません。', 
                            ephemeral: true 
                        });
                        return;
                    }
                    
                    const member = interaction.member;
                    const hasRole = member.roles.cache.has(roleId);
                    
                    if (action === 'join') {
                        if (hasRole) {
                            await interaction.reply({ 
                                content: '既にこのロールを持っています。', 
                                ephemeral: true 
                            });
                        } else {
                            await member.roles.add(roleId);
                            await interaction.reply({ 
                                content: `${role.name} ロールを付与しました。`, 
                                ephemeral: true 
                            });
                        }
                    } else {
                        if (!hasRole) {
                            await interaction.reply({ 
                                content: 'このロールを持っていません。', 
                                ephemeral: true 
                            });
                        } else {
                            await member.roles.remove(roleId);
                            await interaction.reply({ 
                                content: `${role.name} ロールを削除しました。`, 
                                ephemeral: true 
                            });
                        }
                    }
                    
                    // Update role panels if they exist
                    updateRolePanels(interaction.client, interaction.guild);
                    
                } catch (error) {
                    console.error('Error handling role button:', error);
                    await interaction.reply({ 
                        content: 'ロールの操作中にエラーが発生しました。ボットに十分な権限があるか確認してください。', 
                        ephemeral: true 
                    });
                }
            }
        }
    }
};

// Function to update all role panels in a guild
async function updateRolePanels(client, guild) {
    const config = client.config;
    const serverId = guild.id;
    
    if (!config.servers[serverId] || !config.servers[serverId].rolePanels) {
        return;
    }
    
    const rolePanels = config.servers[serverId].rolePanels;
    
    for (const [panelName, panelData] of Object.entries(rolePanels)) {
        if (panelData.channelId && panelData.messageId) {
            try {
                const channel = guild.channels.cache.get(panelData.channelId);
                if (channel) {
                    const message = await channel.messages.fetch(panelData.messageId);
                    if (message) {
                        const embed = await createRolePanelEmbed(guild, panelData);
                        await message.edit({ embeds: [embed] });
                    }
                }
            } catch (error) {
                console.error(`Error updating role panel ${panelName}:`, error);
            }
        }
    }
}

// Function to create role panel embed
async function createRolePanelEmbed(guild, panelData) {
    const { EmbedBuilder } = require('discord.js');
    
    const role = guild.roles.cache.get(panelData.roleId);
    const members = guild.members.cache.filter(member => member.roles.cache.has(panelData.roleId));
    
    const embed = new EmbedBuilder()
        .setTitle(panelData.title)
        .setColor(role ? role.color : 0x0099FF);
    
    if (members.size === 0) {
        embed.setDescription('このロールを持っているメンバーはいません。');
    } else {
        let description = '';
        
        if (panelData.showCount) {
            description += `**メンバー数:** ${members.size}\n\n`;
        }
        
        const memberList = members.map(member => `• ${member.displayName}`).join('\n');
        description += memberList;
        
        // Discord embed description limit is 4096 characters
        if (description.length > 4096) {
            description = description.substring(0, 4093) + '...';
        }
        
        embed.setDescription(description);
    }
    
    embed.setTimestamp();
    
    return embed;
}