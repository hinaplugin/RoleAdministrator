const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const { isMenuNameExists, saveMenuData, loadMenuData, deleteMenuData, getAllMenuNames } = require('../utils/panelStorage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolemenu')
        .setDescription('ロール選択メニューを作成・管理します')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('新しいロール選択メニューを作成します')
                .addStringOption(option =>
                    option.setName('roles')
                        .setDescription('対象ロール（複数可、スペース区切り）例: @role1 @role2')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('メニュー名（ファイル名として使用）')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('メニューの説明文')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('placeholder')
                        .setDescription('メニューのプレースホルダーテキスト（デフォルト: ロールを選択してください）')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('ロール選択メニューを削除します')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('削除するメニュー名')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('ロール選択メニューの詳細情報を表示します')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('メニュー名（未指定時は全メニューのリストを表示）')
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
    const rolesString = interaction.options.getString('roles');
    const menuName = interaction.options.getString('name');
    const message = interaction.options.getString('message');
    const placeholder = interaction.options.getString('placeholder') || 'ロールを選択してください';

    const guildId = interaction.guild.id;

    // メニュー名の検証（ファイルシステム安全な文字のみ）
    if (!/^[a-zA-Z0-9_-]+$/.test(menuName)) {
        await interaction.reply({
            content: 'メニュー名は英数字、ハイフン、アンダースコアのみ使用できます。',
            ephemeral: true
        });
        return;
    }

    // メニュー名の重複チェック
    if (isMenuNameExists(guildId, menuName)) {
        await interaction.reply({
            content: `メニュー名 "${menuName}" は既に使用されています。別の名前を指定してください。`,
            ephemeral: true
        });
        return;
    }

    // ロールの解析
    const roleIds = [];
    const roleNames = [];
    const roleMentions = rolesString.match(/<@&(\d+)>/g);

    if (!roleMentions || roleMentions.length === 0) {
        await interaction.reply({
            content: 'ロールが正しく指定されていません。@roleの形式で指定してください。',
            ephemeral: true
        });
        return;
    }

    if (roleMentions.length > 25) {
        await interaction.reply({
            content: 'セレクトメニューには最大25個のロールまで設定できます。',
            ephemeral: true
        });
        return;
    }

    for (const mention of roleMentions) {
        const roleId = mention.match(/\d+/)[0];
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
            await interaction.reply({
                content: `ロール ID ${roleId} が見つかりません。`,
                ephemeral: true
            });
            return;
        }

        if (!roleIds.includes(roleId)) {
            roleIds.push(roleId);
            roleNames.push(role.name);
        }
    }

    // メッセージ内の\\nを改行に変換
    const formattedMessage = message.replace(/\\n/g, '\n');

    // メニューデータを作成
    const menuData = {
        channelId: interaction.channel.id,
        messageId: null, // メッセージ送信後に設定
        roleIds: roleIds,
        message: formattedMessage,
        placeholder: placeholder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // セレクトメニューオプションを作成
    const options = roleIds.map(roleId => {
        const role = interaction.guild.roles.cache.get(roleId);
        return new StringSelectMenuOptionBuilder()
            .setLabel(role.name)
            .setDescription(`${role.name}ロールを付与/削除`)
            .setValue(roleId)
            .setEmoji('🎭');
    });

    // セレクトメニューを作成
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`role_menu_${menuName}`)
        .setPlaceholder(placeholder)
        .setMinValues(0)
        .setMaxValues(roleIds.length)
        .addOptions(options);

    const row = new ActionRowBuilder()
        .addComponents(selectMenu);

    // メニューをチャンネルに直接送信
    const sentMessage = await interaction.channel.send({
        content: formattedMessage,
        components: [row]
    });

    // メッセージIDでメニューデータを更新
    menuData.messageId = sentMessage.id;

    // メニューデータをファイルに保存
    const saved = saveMenuData(guildId, menuName, menuData);

    if (saved) {
        console.log(`ロール選択メニュー "${menuName}" を ${interaction.user.tag} が ${interaction.guild.name} で作成しました`);
        console.log(`ロール: ${roleNames.join(', ')}`);

        // 作成完了メッセージをephemeralで送信
        await interaction.reply({
            content: `✅ ロール選択メニュー "${menuName}" を作成しました。`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: '⚠️ メニューは作成されましたが、データの保存に失敗しました。',
            ephemeral: true
        });
    }
}

async function handleDeleteCommand(interaction) {
    const menuName = interaction.options.getString('name');
    const guildId = interaction.guild.id;

    // メニュー名の検証
    if (!/^[a-zA-Z0-9_-]+$/.test(menuName)) {
        await interaction.reply({
            content: 'メニュー名は英数字、ハイフン、アンダースコアのみ使用できます。',
            ephemeral: true
        });
        return;
    }

    // メニューの存在確認
    const menuData = loadMenuData(guildId, menuName);
    if (!menuData) {
        await interaction.reply({
            content: `メニュー "${menuName}" が見つかりません。`,
            ephemeral: true
        });
        return;
    }

    // メッセージの削除を試行
    let messageDeleted = false;
    if (menuData.channelId && menuData.messageId) {
        try {
            const channel = interaction.guild.channels.cache.get(menuData.channelId);
            if (channel) {
                const message = await channel.messages.fetch(menuData.messageId);
                if (message) {
                    await message.delete();
                    messageDeleted = true;
                }
            }
        } catch (error) {
            console.error(`メニューメッセージの削除エラー: ${guildId}/${menuName}:`, error);
        }
    }

    // メニューデータの削除
    const deleted = deleteMenuData(guildId, menuName);

    if (deleted) {
        const statusMessage = messageDeleted
            ? `メニュー "${menuName}" とメッセージを削除しました。`
            : `メニュー "${menuName}" を削除しました。（メッセージの削除は失敗しました）`;

        await interaction.reply({
            content: statusMessage,
            ephemeral: true
        });

        console.log(`ロール選択メニュー "${menuName}" を ${interaction.user.tag} が ${interaction.guild.name} で削除しました`);
    } else {
        await interaction.reply({
            content: `メニュー "${menuName}" の削除に失敗しました。`,
            ephemeral: true
        });
    }
}

async function handleInfoCommand(interaction) {
    const menuName = interaction.options.getString('name');
    const guildId = interaction.guild.id;

    if (!menuName) {
        // メニューリストを表示
        const menuNames = getAllMenuNames(guildId);

        if (menuNames.length === 0) {
            await interaction.reply({
                content: 'このサーバーにはロール選択メニューが作成されていません。',
                ephemeral: true
            });
            return;
        }

        const embed = {
            title: '📋 ロール選択メニュー一覧',
            description: `このサーバーで作成されているメニュー: ${menuNames.length}個`,
            fields: menuNames.map((name, index) => ({
                name: `${index + 1}. ${name}`,
                value: `\`/rolemenu info name:${name}\` で詳細を確認`,
                inline: false
            })),
            color: 0x3498db,
            timestamp: new Date().toISOString(),
            footer: {
                text: 'ロール選択メニュー管理システム'
            }
        };

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    } else {
        // 特定のメニューの詳細を表示
        if (!/^[a-zA-Z0-9_-]+$/.test(menuName)) {
            await interaction.reply({
                content: 'メニュー名は英数字、ハイフン、アンダースコアのみ使用できます。',
                ephemeral: true
            });
            return;
        }

        const menuData = loadMenuData(guildId, menuName);
        if (!menuData) {
            await interaction.reply({
                content: `メニュー "${menuName}" が見つかりません。`,
                ephemeral: true
            });
            return;
        }

        // ロール情報を取得
        const roleInfos = menuData.roleIds ? menuData.roleIds.map(roleId => {
            const role = interaction.guild.roles.cache.get(roleId);
            return role ? `<@&${roleId}> (${role.name})` : `<@&${roleId}> (削除済み)`;
        }) : [];

        // チャンネル情報を取得
        let channelInfo = 'なし';
        if (menuData.channelId) {
            const channel = interaction.guild.channels.cache.get(menuData.channelId);
            channelInfo = channel ? `<#${menuData.channelId}> (${channel.name})` : `${menuData.channelId} (削除済み)`;
        }

        const embed = {
            title: `📋 メニュー詳細: ${menuName}`,
            fields: [
                {
                    name: '📄 説明文',
                    value: menuData.message || 'なし',
                    inline: false
                },
                {
                    name: '🎭 対象ロール',
                    value: roleInfos.length > 0 ? roleInfos.join('\n') : 'なし',
                    inline: false
                },
                {
                    name: '💬 プレースホルダー',
                    value: menuData.placeholder || 'なし',
                    inline: true
                },
                {
                    name: '📍 設置チャンネル',
                    value: channelInfo,
                    inline: true
                },
                {
                    name: '🆔 メッセージID',
                    value: menuData.messageId || 'なし',
                    inline: true
                },
                {
                    name: '📅 作成日時',
                    value: new Date(menuData.createdAt).toLocaleString('ja-JP'),
                    inline: true
                },
                {
                    name: '🔄 更新日時',
                    value: new Date(menuData.updatedAt).toLocaleString('ja-JP'),
                    inline: true
                }
            ],
            color: 0x3498db,
            timestamp: new Date().toISOString(),
            footer: {
                text: `メニュー: ${menuName}`
            }
        };

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
}