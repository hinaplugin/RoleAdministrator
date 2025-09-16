const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('パネルデータを再読み込みします')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        await interaction.reply({
            content: '✅ パネルデータはファイルから自動的に読み込まれるため、手動での再読み込みは不要です。',
            ephemeral: true
        });

        console.log(`Reload command used by ${interaction.user.tag} in ${interaction.guild.name}`);
    }
};