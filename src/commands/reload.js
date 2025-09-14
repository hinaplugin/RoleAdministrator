const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('configファイルを再読み込みします')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
    async execute(interaction) {
        try {
            // Reload configuration
            interaction.client.loadConfig();
            
            await interaction.reply({ 
                content: '✅ configファイルの再読み込みが完了しました。', 
                ephemeral: true 
            });
            
            console.log(`Config reloaded by ${interaction.user.tag} in ${interaction.guild.name}`);
            
        } catch (error) {
            console.error('Error reloading config:', error);
            
            await interaction.reply({ 
                content: '❌ configファイルの再読み込み中にエラーが発生しました。', 
                ephemeral: true 
            });
        }
    }
};