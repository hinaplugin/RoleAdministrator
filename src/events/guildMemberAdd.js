const { Events } = require('discord.js');
const { updateRolePanels } = require('../utils/rolePanel');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const client = member.client;
        const config = client.config;
        const serverId = member.guild.id;
        
        // Check if server configuration exists
        if (!config.servers[serverId]) {
            console.log(`No configuration found for server: ${member.guild.name} (${serverId})`);
            return;
        }
        
        const serverConfig = config.servers[serverId];
        const autoRoleConfig = serverConfig.autoRole;
        
        // Check if auto-role is enabled
        if (!autoRoleConfig.enabled || !autoRoleConfig.roleIds || autoRoleConfig.roleIds.length === 0) {
            return;
        }
        
        console.log(`New member joined: ${member.user.tag} in ${member.guild.name}`);
        
        // Process each role ID
        for (const roleId of autoRoleConfig.roleIds) {
            try {
                const role = member.guild.roles.cache.get(roleId);
                
                if (!role) {
                    console.error(`Role not found: ${roleId} in ${member.guild.name}`);
                    continue;
                }
                
                // Check if bot has permission to manage this role
                if (role.position >= member.guild.members.me.roles.highest.position) {
                    console.error(`Cannot assign role ${role.name}: Bot's highest role is not high enough`);
                    continue;
                }
                
                await member.roles.add(roleId);
                console.log(`Successfully added role ${role.name} to ${member.user.tag}`);
                
            } catch (error) {
                console.error(`Error adding role ${roleId} to ${member.user.tag}:`, error);
            }
        }
        
        // Update role panels after role assignments
        updateRolePanels(client, member.guild);
    }
};