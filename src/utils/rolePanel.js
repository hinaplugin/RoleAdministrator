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
        // If specific roles are provided, only update panels for those roles
        if (changedRoleIds && !changedRoleIds.includes(panelData.roleId)) {
            continue;
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
    
    const role = guild.roles.cache.get(panelData.roleId);
    const members = guild.members.cache.filter(member => member.roles.cache.has(panelData.roleId));
    
    const embed = new EmbedBuilder()
        .setTitle(panelData.title)
        .setColor(role ? role.color : 0x0099FF);
    
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