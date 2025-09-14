const { Events } = require('discord.js');

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

// Function to update all role panels in a guild
async function updateRolePanels(client, guild) {
    const config = client.config;
    const serverId = guild.id;
    
    if (!config.servers[serverId] || !config.servers[serverId].rolePanels) {
        return;
    }
    
    const rolePanels = config.servers[serverId].rolePanels;
    
    for (const [panelName, panelData] of Object.entries(rolePanels)) {
        if (panelData.channelId && panelData.messageId) {
            try {
                const channel = guild.channels.cache.get(panelData.channelId);
                if (channel) {
                    const message = await channel.messages.fetch(panelData.messageId);
                    if (message) {
                        const embed = await createRolePanelEmbed(guild, panelData);
                        await message.edit({ embeds: [embed] });
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
    const { EmbedBuilder } = require('discord.js');
    
    const role = guild.roles.cache.get(panelData.roleId);
    const members = guild.members.cache.filter(member => member.roles.cache.has(panelData.roleId));
    
    const embed = new EmbedBuilder()
        .setTitle(panelData.title)
        .setColor(role ? role.color : 0x0099FF);
    
    if (members.size === 0) {
        embed.setDescription('このロールを持っているメンバーはいません。');
    } else {
        let description = '';
        
        if (panelData.showCount) {
            description += `**メンバー数:** ${members.size}\n\n`;
        }
        
        const memberList = members.map(member => `• ${member.displayName}`).join('\n');
        description += memberList;
        
        // Discord embed description limit is 4096 characters
        if (description.length > 4096) {
            description = description.substring(0, 4093) + '...';
        }
        
        embed.setDescription(description);
    }
    
    embed.setTimestamp();
    
    return embed;
}