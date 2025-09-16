const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('ヘルプ情報を表示します')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 WelcomePower Bot - ヘルプ')
            .setDescription('Discord ロール管理ボットのコマンド一覧')
            .setColor(0x0099FF)
            .addFields(
                {
                    name: '📋 **ロールパネル管理**',
                    value: '`/rolepanel create` - 新しいロールパネルを作成\n' +
                           '`/rolepanel delete` - パネルを削除\n' +
                           '`/rolepanel info` - パネル一覧・詳細表示',
                    inline: false
                },
                {
                    name: '🔘 **ロールボタン管理**',
                    value: '`/rolebutton create` - 新しいロールボタンを作成\n' +
                           '`/rolebutton delete` - ボタンを削除\n' +
                           '`/rolebutton info` - ボタン一覧・詳細表示',
                    inline: false
                },
                {
                    name: '❓ **その他**',
                    value: '`/help` - このヘルプメッセージを表示',
                    inline: false
                }
            )
            .addFields(
                {
                    name: '⚙️ **機能説明**',
                    value: '**自動ロール付与**: 新規メンバーが参加した際、設定されたロールを自動で付与\n' +
                           '**ロールパネル**: 指定したロールの所有者一覧をEmbedで表示（動的作成・削除可能）\n' +
                           '**ロールボタン**: ユーザーがボタンを押してロールのつけ外しが可能（動的作成・削除可能）',
                    inline: false
                },
                {
                    name: '🗂️ **データ管理**',
                    value: '**設定ファイル**: `config.json` で自動ロール付与とデフォルト設定を管理\n' +
                           '**ファイルベース保存**: パネル・ボタンデータは個別JSONファイルで管理\n' +
                           '**自動更新**: ロール変更時にパネルが自動で更新されます',
                    inline: false
                },
                {
                    name: '🛡️ **権限要件**',
                    value: '**コマンド実行**: サーバー管理権限が必要\n' +
                           '**ボット権限**: ロールの管理、メッセージ送信、埋め込みリンク権限が必要\n' +
                           '**詳細**: README.mdの権限設定セクションを参照',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: `リクエスト者: ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};