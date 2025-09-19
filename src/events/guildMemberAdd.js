const { Events } = require('discord.js');
const { updateRolePanels } = require('../utils/rolePanel');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const serverId = member.guild.id;

        // config.jsonを読み込み
        let config;
        try {
            const configPath = process.env.CONFIG_PATH || path.join(__dirname, '..', 'config.json');
            if (!fs.existsSync(configPath)) {
                console.log(`設定ファイルが見つかりません: ${configPath}`);
                return;
            }

            const configData = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(configData);
        } catch (error) {
            console.error('config.json読み込みエラー:', error);
            return;
        }

        // サーバー設定の存在確認
        if (!config.servers || !config.servers[serverId]) {
            console.log(`サーバー設定が見つかりません: ${member.guild.name} (${serverId})`);
            return;
        }
        
        const serverConfig = config.servers[serverId];
        const autoRoleConfig = serverConfig.autoRole;
        
        // 自動ロール付与が有効かチェック
        if (!autoRoleConfig || !autoRoleConfig.enabled || !autoRoleConfig.roleIds || autoRoleConfig.roleIds.length === 0) {
            return;
        }

        console.log(`新しいメンバーが参加しました: ${member.user.tag} (${member.guild.name})`);
        
        // 各ロールIDを処理
        for (const roleId of autoRoleConfig.roleIds) {
            try {
                const role = member.guild.roles.cache.get(roleId);

                if (!role) {
                    console.error(`ロールが見つかりません: ${roleId} (${member.guild.name})`);
                    continue;
                }

                // ボットがこのロールを管理する権限があるかチェック
                if (role.position >= member.guild.members.me.roles.highest.position) {
                    console.error(`ロール付与失敗 ${role.name}: ボットの最高ロールが不十分です`);
                    continue;
                }

                await member.roles.add(roleId);
                console.log(`ロール付与成功: ${member.user.tag} に "${role.name}" を付与`);

            } catch (error) {
                console.error(`ロール付与エラー ${roleId} -> ${member.user.tag}:`, error);
            }
        }

        // ロール付与後にロールパネルを更新
        updateRolePanels(member.guild);
    }
};