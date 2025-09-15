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
                console.log(`Attempting to update panel ${panelName} - Channel: ${panelData.channelId}, Message: ${panelData.messageId}`);
                const channel = guild.channels.cache.get(panelData.channelId);
                if (!channel) {
                    console.error(`Channel not found: ${panelData.channelId}`);
                    continue;
                }
                
                console.log(`Found channel: ${channel.name}`);
                const message = await channel.messages.fetch(panelData.messageId);
                if (!message) {
                    console.error(`Message not found: ${panelData.messageId}`);
                    continue;
                }
                
                console.log(`Found message, creating embed...`);
                const embed = await createRolePanelEmbed(guild, panelData);
                console.log(`Embed created, updating message...`);
                
                // Check bot permissions
                const botMember = guild.members.cache.get(guild.client.user.id);
                const canManageMessages = channel.permissionsFor(botMember).has('ManageMessages');
                const canSendMessages = channel.permissionsFor(botMember).has('SendMessages');
                console.log(`Bot permissions - ManageMessages: ${canManageMessages}, SendMessages: ${canSendMessages}`);
                
                // Validate embed
                if (!embed.data.title || !embed.data.description) {
                    console.error('Invalid embed: missing title or description');
                    return;
                }
                
                // Attempt to edit the message
                const editResult = await message.edit({ embeds: [embed] });
                console.log(`Message edit result - ID: ${editResult.id}, Updated: ${editResult.editedTimestamp}`);
                
                // Verify the message was actually updated
                const updatedMessage = await channel.messages.fetch(panelData.messageId, { force: true });
                console.log(`Verification - Message embeds count: ${updatedMessage.embeds.length}`);
                if (updatedMessage.embeds.length > 0) {
                    console.log(`Embed title: ${updatedMessage.embeds[0].title}`);
                    console.log(`Embed description length: ${updatedMessage.embeds[0].description?.length || 0}`);
                }
                
                console.log(`✅ Updated role panel ${panelName} in ${guild.name}`);
            } catch (error) {
                console.error(`❌ Error updating role panel ${panelName}:`, error.message);
                console.error('Full error:', error);
            }
        } else {
            console.log(`Skipping panel ${panelName} - missing channelId or messageId`);
        }
    }
}

// Function to create role panel embed
async function createRolePanelEmbed(guild, panelData) {
    console.log(`Creating embed for panel: ${panelData.title}`);
    
    // Ensure we have all guild members in cache
    await guild.members.fetch();
    console.log(`Fetched ${guild.memberCount} members`);
    
    // Support both old roleId format and new roleIds array format
    const roleIds = Array.isArray(panelData.roleIds) ? panelData.roleIds : [panelData.roleId || panelData.roleIds];
    console.log(`Role IDs to process:`, roleIds);
    
    // Get all roles and find a color for the embed
    const roles = roleIds.map(roleId => guild.roles.cache.get(roleId)).filter(role => role);
    console.log(`Found ${roles.length} valid roles:`, roles.map(r => r.name));
    const embedColor = roles.find(role => role.color !== 0)?.color || 0x0099FF;
    
    // Get all members who have at least one of the specified roles
    const members = guild.members.cache.filter(member => 
        roleIds.some(roleId => member.roles.cache.has(roleId))
    );
    
    const embed = new EmbedBuilder()
        .setTitle(panelData.title)
        .setColor(embedColor);
    
    let description = '';
    
    // Check if any roles have members
    const hasAnyMembers = roles.some(role => 
        guild.members.cache.some(member => member.roles.cache.has(role.id))
    );
    
    if (!hasAnyMembers) {
        description = 'このロールを持っているメンバーはいません。';
    } else {
        // Display each role and its members separately
        for (const role of roles) {
            const roleMembers = guild.members.cache.filter(member => 
                member.roles.cache.has(role.id)
            );
            console.log(`Role ${role.name} has ${roleMembers.size} members`);
            
            if (roleMembers.size > 0) {
                description += `## ${role}\n\n`;
                
                const memberList = roleMembers.map(member => `${member}`).join(' ');
                description += memberList;
                
                if (panelData.showCount) {
                    description += `\n**メンバー数:** ${roleMembers.size}`;
                }
                
                description += '\n\n';
            }
        }
        console.log(`Final description length: ${description.length} characters`);
        console.log(`Description preview: ${description.substring(0, 200)}...`);
        
        // Remove trailing newlines
        description = description.trim();
    }
    
    // Discord embed description limit is 4096 characters
    if (description.length > 4096) {
        description = description.substring(0, 4093) + '...';
    }
    
    embed.setDescription(description);
    
    embed.setTimestamp();
    
    return embed;
}

module.exports = {
    updateRolePanels,
    createRolePanelEmbed
};