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
                    name: '📋 `/rolepanel <panelName>`',
                    value: '指定したロールパネルを召喚・設置します\n例: `/rolepanel admin`',
                    inline: false
                },
                {
                    name: '🔘 `/rolebutton <buttonName>`',
                    value: '指定したロール切り替えボタンパネルを送信・設置します\n例: `/rolebutton notification`',
                    inline: false
                },
                {
                    name: '🔄 `/reload`',
                    value: 'configファイルを再読み込みします',
                    inline: false
                },
                {
                    name: '❓ `/help`',
                    value: 'このヘルプメッセージを表示します',
                    inline: false
                }
            )
            .addFields(
                {
                    name: '⚙️ 機能説明',
                    value: '**自動ロール付与**: 新規メンバーが参加した際、設定されたロールを自動で付与\n' +
                           '**ロールパネル**: 指定したロールの所有者一覧をEmbedで表示\n' +
                           '**ロールボタン**: ユーザーがボタンを押してロールのつけ外しが可能',
                    inline: false
                },
                {
                    name: '🔧 設定ファイル',
                    value: 'すべての設定は `src/config.json` で管理されています。\n' +
                           'パネルやボタンの召喚時に、チャンネルIDとメッセージIDが自動保存されます。',
                    inline: false
                },
                {
                    name: '🛡️ 権限要件',
                    value: 'すべてのコマンドはサーバー管理権限が必要です。\n' +
                           'ボットには「ロールの管理」と「メッセージ送信」権限が必要です。',
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