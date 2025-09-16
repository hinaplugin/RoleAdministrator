const { EmbedBuilder } = require('discord.js');
const { loadAllPanelsForGuild, savePanelData } = require('./panelStorage');

// Function to update all role panels in a guild (or specific panels for changed roles)
async function updateRolePanels(client, guild, changedRoleIds = null) {
    const guildId = guild.id;
    
    // Load all panels for this guild
    const panels = loadAllPanelsForGuild(guildId);
    
    if (Object.keys(panels).length === 0) {
        return;
    }
    
    // Ensure we have fresh member data before updating panels
    try {
        await guild.members.fetch();
    } catch (error) {
        console.error('Error fetching guild members for panel update:', error);
    }
    
    for (const [panelName, panelData] of Object.entries(panels)) {
        // If specific roles are provided, only update panels that contain those roles
        if (changedRoleIds) {
            const panelRoleIds = panelData.roleIds || [];
            const hasChangedRole = changedRoleIds.some(roleId => panelRoleIds.includes(roleId));
            if (!hasChangedRole) {
                continue;
            }
        }
        
        if (panelData.channelId && panelData.messageId) {
            try {
                const channel = guild.channels.cache.get(panelData.channelId);
                if (!channel) {
                    console.error(`Channel not found: ${panelData.channelId}`);
                    continue;
                }
                
                const message = await channel.messages.fetch(panelData.messageId);
                if (!message) {
                    console.error(`Message not found: ${panelData.messageId}`);
                    continue;
                }
                
                // Check bot permissions
                const botMember = guild.members.cache.get(guild.client.user.id);
                const channelPerms = channel.permissionsFor(botMember);
                const canSendMessages = channelPerms.has('SendMessages');
                const canManageMessages = channelPerms.has('ManageMessages');
                const canEmbedLinks = channelPerms.has('EmbedLinks');
                
                if (!canSendMessages) {
                    console.error(`❌ Bot lacks SendMessages permission in channel #${channel.name} (${channel.id})`);
                    console.error(`Channel type: ${channel.type}, Parent: ${channel.parent?.name || 'None'}`);
                    console.error(`Permissions - Send: ${canSendMessages}, Manage: ${canManageMessages}, Embed: ${canEmbedLinks}`);
                    console.error('Please check:');
                    console.error('1. Bot role permissions in server settings');
                    console.error('2. Channel-specific permission overrides');
                    console.error('3. Category channel permission inheritance');
                    continue;
                }
                
                if (!canEmbedLinks) {
                    console.error(`❌ Bot lacks EmbedLinks permission in channel #${channel.name}`);
                    console.error('Role panel will not display properly without this permission.');
                    console.error('Please grant the bot "埋め込みリンク" (Embed Links) permission in:');
                    console.error('1. Server Settings → Roles → Bot Role → Embed Links');
                    console.error('2. Or Channel Settings → Permissions → Bot → Embed Links');
                    continue;
                }
                
                const embed = await createRolePanelEmbed(guild, panelData);
                await message.edit({ embeds: [embed] });
                console.log(`Updated role panel ${panelName} in ${guild.name}`);
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
    
    // Get role IDs from panel data
    const roleIds = panelData.roleIds || [];
    
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
    
    // Add custom description if provided
    if (panelData.message) {
        embed.setDescription(panelData.message);
    }
    
    // Check if any roles have members
    const hasAnyMembers = roles.some(role => 
        guild.members.cache.some(member => member.roles.cache.has(role.id))
    );
    
    if (!hasAnyMembers) {
        embed.addFields({
            name: 'メンバー',
            value: 'このロールを持っているメンバーはいません。',
            inline: false
        });
    } else {
        // Display each role and its members separately
        for (const role of roles) {
            const roleMembers = guild.members.cache.filter(member => 
                member.roles.cache.has(role.id)
            );
            
            if (roleMembers.size > 0) {
                const memberList = roleMembers.map(member => `${member}`).join(' ');
                let fieldValue = memberList;
                
                if (panelData.showCount) {
                    fieldValue += `\n\n**メンバー数:** ${roleMembers.size}`;
                }
                
                // Discord field value limit is 1024 characters
                if (fieldValue.length > 1024) {
                    fieldValue = fieldValue.substring(0, 1021) + '...';
                }
                
                embed.addFields({
                    name: `## ${role.name}`,
                    value: fieldValue,
                    inline: false
                });
            }
        }
    }
    
    embed.setTimestamp();
    
    return embed;
}

module.exports = {
    updateRolePanels,
    createRolePanelEmbed
};