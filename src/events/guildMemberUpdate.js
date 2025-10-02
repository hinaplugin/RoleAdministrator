const { Events } = require('discord.js');
const { updateRolePanels } = require('../utils/rolePanel');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        // ロール変更をチェック
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        if (oldRoles.size !== newRoles.size || !oldRoles.equals(newRoles)) {
            // 最新のメンバーデータを確保（ロール変更があった場合のみ）
            try {
                await newMember.guild.members.fetch({ timeout: 60000 });
            } catch (error) {
                console.error('サーバーメンバー取得エラー:', error);
            }

            // 変更されたロールを検出
            const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
            const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

            // ログ出力
            const userName = newMember.user.tag;
            const guildName = newMember.guild.name;

            if (addedRoles.size > 0) {
                const addedRoleNames = addedRoles.map(role => role.name).join(', ');
                console.log(`ロール付与: ${userName} に "${addedRoleNames}" を付与 (${guildName})`);
            }

            if (removedRoles.size > 0) {
                const removedRoleNames = removedRoles.map(role => role.name).join(', ');
                console.log(`ロール削除: ${userName} から "${removedRoleNames}" を削除 (${guildName})`);
            }

            const changedRoleIds = [
                ...addedRoles.map(role => role.id),
                ...removedRoles.map(role => role.id)
            ];

            // 変更されたロールのパネルのみ更新
            updateRolePanels(newMember.guild, changedRoleIds);
        }
    }
};