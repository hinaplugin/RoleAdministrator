const { EmbedBuilder } = require('discord.js');

// Function to update all role panels in a guild (or specific panels for changed roles)
async function updateRolePanels(client, guild, changedRoleIds = null) {
    const config = client.config;
    const serverId = guild.id;
    
    if (!config.servers[serverId] || !config.servers[serverId].rolePanels) {
        return;
    }
    
    // Ensure we have fresh member data before updating panels
    try {
        await guild.members.fetch();
    } catch (error) {
        console.error('Error fetching guild members for panel update:', error);
    }
    
    const rolePanels = config.servers[serverId].rolePanels;
    
    for (const [panelName, panelData] of Object.entries(rolePanels)) {
        // If specific roles are provided, only update panels that contain those roles
        if (changedRoleIds) {
            const panelRoleIds = Array.isArray(panelData.roleIds) ? panelData.roleIds : [panelData.roleId || panelData.roleIds];
            const hasChangedRole = changedRoleIds.some(roleId => panelRoleIds.includes(roleId));
            if (!hasChangedRole) {
                continue;
            }
        }
        
        if (panelData.channelId && panelData.messageId) {
            try {
                const channel = guild.channels.cache.get(panelData.channelId);
                if (channel) {
                    const message = await channel.messages.fetch(panelData.messageId);
                    if (message) {
                        const embed = await createRolePanelEmbed(guild, panelData);
                        await message.edit({ embeds: [embed] });
                        console.log(`Updated role panel ${panelName} in ${guild.name}`);
                    }
                }
            } catch (error) {
                console.error(`Error updating role panel ${panelName}:`, error);
            }
        }
    }
}

// Function to create role panel embed
async function createRolePanelEmbed(guild, panelData) {
    // Ensure we have all guild members in cache
    await guild.members.fetch();
    
    // Support both old roleId format and new roleIds array format
    const roleIds = Array.isArray(panelData.roleIds) ? panelData.roleIds : [panelData.roleId || panelData.roleIds];
    
    // Get all roles and find a color for the embed
    const roles = roleIds.map(roleId => guild.roles.cache.get(roleId)).filter(role => role);
    const embedColor = roles.find(role => role.color !== 0)?.color || 0x0099FF;
    
    // Get all members who have at least one of the specified roles
    const members = guild.members.cache.filter(member => 
        roleIds.some(roleId => member.roles.cache.has(roleId))
    );
    
    const embed = new EmbedBuilder()
        .setTitle(panelData.title)
        .setColor(embedColor);
    
    if (members.size === 0) {
        embed.setDescription('このロールを持っているメンバーはいません。');
    } else {
        let description = '';
        
        const memberList = members.map(member => `${member}`).join(' ');
        description += memberList;
        
        if (panelData.showCount) {
            description += `\n\n**メンバー数:** ${members.size}`;
        }
        
        // Discord embed description limit is 4096 characters
        if (description.length > 4096) {
            description = description.substring(0, 4093) + '...';
        }
        
        embed.setDescription(description);
    }
    
    embed.setTimestamp();
    
    return embed;
}

module.exports = {
    updateRolePanels,
    createRolePanelEmbed
};