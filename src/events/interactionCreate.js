const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`コマンドが見つかりません: ${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('コマンド実行エラー:', error);
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
                    console.error('ロールボタン処理エラー:', error);
                    await interaction.reply({ 
                        content: 'ロールの操作中にエラーが発生しました。ボットに十分な権限があるか確認してください。', 
                        ephemeral: true 
                    });
                }
            }
        } else if (interaction.isStringSelectMenu()) {
            // Handle select menu interactions for role menus
            const customId = interaction.customId;

            if (customId.startsWith('role_menu_')) {
                const menuName = customId.replace('role_menu_', '');
                const selectedRoles = interaction.values;

                try {
                    const member = interaction.member;
                    const { loadMenuData } = require('../utils/panelStorage');
                    const menuData = loadMenuData(interaction.guild.id, menuName);

                    if (!menuData) {
                        await interaction.reply({
                            content: 'メニューデータが見つかりません。',
                            ephemeral: true
                        });
                        return;
                    }

                    const allMenuRoles = menuData.roleIds || [];
                    const addedRoles = [];
                    const removedRoles = [];
                    const failedRoles = [];

                    // 現在メンバーが持っているメニューのロールを確認
                    const currentMenuRoles = allMenuRoles.filter(roleId =>
                        member.roles.cache.has(roleId)
                    );

                    // 選択されたロールを追加
                    for (const roleId of selectedRoles) {
                        if (!member.roles.cache.has(roleId)) {
                            const role = interaction.guild.roles.cache.get(roleId);
                            if (role) {
                                try {
                                    await member.roles.add(roleId);
                                    addedRoles.push(role.name);
                                } catch (error) {
                                    console.error(`ロール追加エラー: ${role.name}`, error);
                                    failedRoles.push(role.name);
                                }
                            }
                        }
                    }

                    // 選択されていない（但し、現在持っている）ロールを削除
                    for (const roleId of currentMenuRoles) {
                        if (!selectedRoles.includes(roleId)) {
                            const role = interaction.guild.roles.cache.get(roleId);
                            if (role) {
                                try {
                                    await member.roles.remove(roleId);
                                    removedRoles.push(role.name);
                                } catch (error) {
                                    console.error(`ロール削除エラー: ${role.name}`, error);
                                    failedRoles.push(role.name);
                                }
                            }
                        }
                    }

                    // 結果メッセージを作成
                    let resultMessage = '';

                    if (addedRoles.length > 0) {
                        resultMessage += `✅ 付与: ${addedRoles.join(', ')}`;
                    }

                    if (removedRoles.length > 0) {
                        if (resultMessage) resultMessage += '\n';
                        resultMessage += `❌ 削除: ${removedRoles.join(', ')}`;
                    }

                    if (failedRoles.length > 0) {
                        if (resultMessage) resultMessage += '\n';
                        resultMessage += `⚠️ 失敗: ${failedRoles.join(', ')}`;
                    }

                    if (!resultMessage) {
                        resultMessage = '変更はありませんでした。';
                    }

                    await interaction.reply({
                        content: resultMessage,
                        ephemeral: true
                    });

                } catch (error) {
                    console.error('ロールメニュー処理エラー:', error);
                    await interaction.reply({
                        content: 'ロールの操作中にエラーが発生しました。ボットに十分な権限があるか確認してください。',
                        ephemeral: true
                    });
                }
            }
        }
    }
};