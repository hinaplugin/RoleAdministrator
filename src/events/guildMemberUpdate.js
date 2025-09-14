const { Events } = require('discord.js');
const { updateRolePanels } = require('../utils/rolePanel');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        const client = newMember.client;
        const config = client.config;
        const serverId = newMember.guild.id;
        
        // Check if server configuration exists
        if (!config.servers[serverId]) {
            return;
        }
        
        // Check if roles have changed
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;
        
        if (oldRoles.size !== newRoles.size || !oldRoles.equals(newRoles)) {
            // Detect which roles have changed
            const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
            const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));
            
            const changedRoleIds = [
                ...addedRoles.map(role => role.id),
                ...removedRoles.map(role => role.id)
            ];
            
            console.log(`Role change detected for ${newMember.user.tag} in ${newMember.guild.name}: ${changedRoleIds.join(', ')}`);
            
            // Update only role panels for the changed roles
            updateRolePanels(client, newMember.guild, changedRoleIds);
        }
    }
};