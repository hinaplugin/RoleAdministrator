const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const { isButtonNameExists, saveButtonData, loadButtonData, deleteButtonData, getAllButtonNames } = require('../utils/panelStorage');
const fs = require('fs');
const path = require('path');

// デフォルト設定を読み込み
function getDefaultButtonSettings() {
    try {
        const configPath = process.env.CONFIG_PATH || path.join(__dirname, '..', 'config.json');
        if (fs.existsSync(configPath)) {
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return configData.servers?.EXAMPLE_SERVER_ID?.defaultButtonSettings || {
                joinLabel: "参加",
                leaveLabel: "退出",
                joinEmoji: "✅",
                leaveEmoji: "❌"
            };
        }
    } catch (error) {
        console.error('デフォルト設定読み込みエラー:', error);
    }

    return {
        joinLabel: "参加",
        leaveLabel: "退出",
        joinEmoji: "✅",
        leaveEmoji: "❌"
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolebutton')
        .setDescription('ロールボタンを作成・設置します')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('新しいロールボタンを作成します')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('対象ロール')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('ボタン名（ファイル名として使用）')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('ボタンの説明文')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('joinlabel')
                        .setDescription('参加ボタンのラベル（デフォルト: 参加）')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('leavelabel')
                        .setDescription('退出ボタンのラベル（デフォルト: 退出）')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('ボタンを削除します')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('削除するボタン名')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('ボタンの詳細情報を表示します')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('ボタン名（未指定時は全ボタンのリストを表示）')
                        .setRequired(false)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            await handleCreateCommand(interaction);
        } else if (subcommand === 'delete') {
            await handleDeleteCommand(interaction);
        } else if (subcommand === 'info') {
            await handleInfoCommand(interaction);
        }
    }
};

async function handleCreateCommand(interaction) {
    const role = interaction.options.getRole('role');
    const buttonName = interaction.options.getString('name');
    const message = interaction.options.getString('message');
    const joinLabel = interaction.options.getString('joinlabel');
    const leaveLabel = interaction.options.getString('leavelabel');

    const guildId = interaction.guild.id;

    // ボタン名の検証（ファイルシステム安全な文字のみ）
    if (!/^[a-zA-Z0-9_-]+$/.test(buttonName)) {
        await interaction.reply({
            content: 'ボタン名は英数字、ハイフン、アンダースコアのみ使用できます。',
            ephemeral: true
        });
        return;
    }

    // ボタン名の重複チェック
    if (isButtonNameExists(guildId, buttonName)) {
        await interaction.reply({
            content: `ボタン名 "${buttonName}" は既に使用されています。別の名前を指定してください。`,
            ephemeral: true
        });
        return;
    }

    // デフォルト設定を取得
    const defaultSettings = getDefaultButtonSettings();

    // ボタンデータを作成
    const buttonData = {
        channelId: interaction.channel.id,
        messageId: null, // メッセージ送信後に設定
        roleId: role.id,
        message: message,
        joinLabel: joinLabel || defaultSettings.joinLabel,
        leaveLabel: leaveLabel || defaultSettings.leaveLabel,
        joinEmoji: defaultSettings.joinEmoji,
        leaveEmoji: defaultSettings.leaveEmoji,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // ボタンを作成
    const joinButton = new ButtonBuilder()
        .setCustomId(`role_join_${role.id}_${buttonName}`)
        .setLabel(buttonData.joinLabel)
        .setEmoji(buttonData.joinEmoji)
        .setStyle(ButtonStyle.Primary);

    const leaveButton = new ButtonBuilder()
        .setCustomId(`role_leave_${role.id}_${buttonName}`)
        .setLabel(buttonData.leaveLabel)
        .setEmoji(buttonData.leaveEmoji)
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
        .addComponents(joinButton, leaveButton);

    // ボタンをチャンネルに直接送信
    const sentMessage = await interaction.channel.send({
        content: message,
        components: [row]
    });

    // メッセージIDでボタンデータを更新
    buttonData.messageId = sentMessage.id;

    // ボタンデータをファイルに保存
    const saved = saveButtonData(guildId, buttonName, buttonData);

    if (saved) {
        console.log(`ロールボタン "${buttonName}" を ${interaction.user.tag} が ${interaction.guild.name} で作成しました`);
        console.log(`ロール: ${role.name} (${role.id})`);

        // 作成完了メッセージをephemeralで送信
        await interaction.reply({
            content: `✅ ロールボタン "${buttonName}" を作成しました。`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: '⚠️ ボタンは作成されましたが、データの保存に失敗しました。',
            ephemeral: true
        });
    }
}

async function handleDeleteCommand(interaction) {
    const buttonName = interaction.options.getString('name');
    const guildId = interaction.guild.id;

    // ボタン名の検証
    if (!/^[a-zA-Z0-9_-]+$/.test(buttonName)) {
        await interaction.reply({
            content: 'ボタン名は英数字、ハイフン、アンダースコアのみ使用できます。',
            ephemeral: true
        });
        return;
    }

    // ボタンの存在確認
    const buttonData = loadButtonData(guildId, buttonName);
    if (!buttonData) {
        await interaction.reply({
            content: `ボタン "${buttonName}" が見つかりません。`,
            ephemeral: true
        });
        return;
    }

    // メッセージの削除を試行
    let messageDeleted = false;
    if (buttonData.channelId && buttonData.messageId) {
        try {
            const channel = interaction.guild.channels.cache.get(buttonData.channelId);
            if (channel) {
                const message = await channel.messages.fetch(buttonData.messageId);
                if (message) {
                    await message.delete();
                    messageDeleted = true;
                }
            }
        } catch (error) {
            console.error(`ボタンメッセージの削除エラー: ${guildId}/${buttonName}:`, error);
        }
    }

    // ボタンデータの削除
    const deleted = deleteButtonData(guildId, buttonName);

    if (deleted) {
        const statusMessage = messageDeleted
            ? `ボタン "${buttonName}" とメッセージを削除しました。`
            : `ボタン "${buttonName}" を削除しました。（メッセージの削除は失敗しました）`;

        await interaction.reply({
            content: statusMessage,
            ephemeral: true
        });

        console.log(`ロールボタン "${buttonName}" を ${interaction.user.tag} が ${interaction.guild.name} で削除しました`);
    } else {
        await interaction.reply({
            content: `ボタン "${buttonName}" の削除に失敗しました。`,
            ephemeral: true
        });
    }
}

async function handleInfoCommand(interaction) {
    const buttonName = interaction.options.getString('name');
    const guildId = interaction.guild.id;

    if (!buttonName) {
        // ボタンリストを表示
        const buttonNames = getAllButtonNames(guildId);

        if (buttonNames.length === 0) {
            await interaction.reply({
                content: 'このサーバーにはボタンが作成されていません。',
                ephemeral: true
            });
            return;
        }

        const embed = {
            title: '🔘 ボタン一覧',
            description: `このサーバーで作成されているボタン: ${buttonNames.length}個`,
            fields: buttonNames.map((name, index) => ({
                name: `${index + 1}. ${name}`,
                value: `\`/rolebutton info name:${name}\` で詳細を確認`,
                inline: false
            })),
            color: 0x9b59b6,
            timestamp: new Date().toISOString(),
            footer: {
                text: 'ボタン管理システム'
            }
        };

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    } else {
        // 特定のボタンの詳細を表示
        if (!/^[a-zA-Z0-9_-]+$/.test(buttonName)) {
            await interaction.reply({
                content: 'ボタン名は英数字、ハイフン、アンダースコアのみ使用できます。',
                ephemeral: true
            });
            return;
        }

        const buttonData = loadButtonData(guildId, buttonName);
        if (!buttonData) {
            await interaction.reply({
                content: `ボタン "${buttonName}" が見つかりません。`,
                ephemeral: true
            });
            return;
        }

        // ロール情報を取得
        let roleInfo = 'なし';
        if (buttonData.roleId) {
            const role = interaction.guild.roles.cache.get(buttonData.roleId);
            roleInfo = role ? `<@&${buttonData.roleId}> (${role.name})` : `<@&${buttonData.roleId}> (削除済み)`;
        }

        // チャンネル情報を取得
        let channelInfo = 'なし';
        if (buttonData.channelId) {
            const channel = interaction.guild.channels.cache.get(buttonData.channelId);
            channelInfo = channel ? `<#${buttonData.channelId}> (${channel.name})` : `${buttonData.channelId} (削除済み)`;
        }

        const embed = {
            title: `🔘 ボタン詳細: ${buttonName}`,
            fields: [
                {
                    name: '📄 説明文',
                    value: buttonData.message || 'なし',
                    inline: false
                },
                {
                    name: '🎭 対象ロール',
                    value: roleInfo,
                    inline: true
                },
                {
                    name: '📍 設置チャンネル',
                    value: channelInfo,
                    inline: true
                },
                {
                    name: '🆔 メッセージID',
                    value: buttonData.messageId || 'なし',
                    inline: true
                },
                {
                    name: '✅ 参加ボタン',
                    value: `${buttonData.joinEmoji || ''} ${buttonData.joinLabel || 'なし'}`,
                    inline: true
                },
                {
                    name: '❌ 退出ボタン',
                    value: `${buttonData.leaveEmoji || ''} ${buttonData.leaveLabel || 'なし'}`,
                    inline: true
                },
                {
                    name: '📅 作成日時',
                    value: new Date(buttonData.createdAt).toLocaleString('ja-JP'),
                    inline: true
                },
                {
                    name: '🔄 更新日時',
                    value: new Date(buttonData.updatedAt).toLocaleString('ja-JP'),
                    inline: true
                }
            ],
            color: 0xe74c3c,
            timestamp: new Date().toISOString(),
            footer: {
                text: `ボタン: ${buttonName}`
            }
        };

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
}