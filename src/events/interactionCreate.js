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
                const parts = customId.split('_');
                const roleId = parts[2];
                
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