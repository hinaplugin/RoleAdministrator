const fs = require('fs');
const path = require('path');

// Get data directory from environment variable or default
function getDataDirectory() {
    return process.env.DATA_DIR || path.join(__dirname, '..', 'data');
}

// Get guild panel directory
function getGuildPanelDirectory(guildId) {
    return path.join(getDataDirectory(), guildId, 'panel');
}

// Ensure directory exists
function ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Save panel data
function savePanelData(guildId, panelName, panelData) {
    try {
        const panelDir = getGuildPanelDirectory(guildId);
        ensureDirectory(panelDir);
        
        const filePath = path.join(panelDir, `${panelName}.json`);
        const dataToSave = {
            ...panelData,
            updatedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
        console.log(`Panel data saved: ${guildId}/${panelName}`);
        return true;
    } catch (error) {
        console.error(`Error saving panel data for ${guildId}/${panelName}:`, error);
        return false;
    }
}

// Load panel data
function loadPanelData(guildId, panelName) {
    try {
        const filePath = path.join(getGuildPanelDirectory(guildId), `${panelName}.json`);
        
        if (!fs.existsSync(filePath)) {
            return null;
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading panel data for ${guildId}/${panelName}:`, error);
        return null;
    }
}

// Get all panel names for a guild
function getAllPanelNames(guildId) {
    try {
        const panelDir = getGuildPanelDirectory(guildId);
        
        if (!fs.existsSync(panelDir)) {
            return [];
        }
        
        const files = fs.readdirSync(panelDir);
        return files
            .filter(file => file.endsWith('.json'))
            .map(file => path.basename(file, '.json'));
    } catch (error) {
        console.error(`Error loading panel names for guild ${guildId}:`, error);
        return [];
    }
}

// Load all panels for a guild
function loadAllPanelsForGuild(guildId) {
    const panels = {};
    const panelNames = getAllPanelNames(guildId);
    
    for (const name of panelNames) {
        const data = loadPanelData(guildId, name);
        if (data) {
            panels[name] = data;
        }
    }
    
    return panels;
}

// Delete panel data
function deletePanelData(guildId, panelName) {
    try {
        const filePath = path.join(getGuildPanelDirectory(guildId), `${panelName}.json`);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Panel data deleted: ${guildId}/${panelName}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error deleting panel data for ${guildId}/${panelName}:`, error);
        return false;
    }
}

module.exports = {
    getDataDirectory,
    getGuildPanelDirectory,
    savePanelData,
    loadPanelData,
    getAllPanelNames,
    loadAllPanelsForGuild,
    deletePanelData
};