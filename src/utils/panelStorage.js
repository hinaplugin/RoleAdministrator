const fs = require('fs');
const path = require('path');

// 環境変数またはデフォルトからデータディレクトリを取得
function getDataDirectory() {
    return process.env.DATA_DIR || path.join(__dirname, '..', 'data');
}

// サーバーのパネルディレクトリを取得
function getGuildPanelDirectory(guildId) {
    return path.join(getDataDirectory(), guildId, 'panel');
}

// サーバーのボタンディレクトリを取得
function getGuildButtonDirectory(guildId) {
    return path.join(getDataDirectory(), guildId, 'button');
}

// ディレクトリの存在を確認
function ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// パネルデータを保存
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
        console.log(`パネルデータを保存しました: ${guildId}/${panelName}`);
        return true;
    } catch (error) {
        console.error(`${guildId}/${panelName} のパネルデータ保存エラー:`, error);
        return false;
    }
}

// パネルデータを読み込み
function loadPanelData(guildId, panelName) {
    try {
        const filePath = path.join(getGuildPanelDirectory(guildId), `${panelName}.json`);
        
        if (!fs.existsSync(filePath)) {
            return null;
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`${guildId}/${panelName} のパネルデータ読み込みエラー:`, error);
        return null;
    }
}

// サーバーのすべてのパネル名を取得
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
        console.error(`サーバー ${guildId} のパネル名読み込みエラー:`, error);
        return [];
    }
}

// サーバーのすべてのパネルを読み込み
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

// パネルデータを削除
function deletePanelData(guildId, panelName) {
    try {
        const filePath = path.join(getGuildPanelDirectory(guildId), `${panelName}.json`);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`パネルデータを削除しました: ${guildId}/${panelName}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`${guildId}/${panelName} のパネルデータ削除エラー:`, error);
        return false;
    }
}

// ボタンデータを保存
function saveButtonData(guildId, buttonName, buttonData) {
    try {
        const buttonDir = getGuildButtonDirectory(guildId);
        ensureDirectory(buttonDir);

        const filePath = path.join(buttonDir, `${buttonName}.json`);
        const dataToSave = {
            ...buttonData,
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
        console.log(`ボタンデータを保存しました: ${guildId}/${buttonName}`);
        return true;
    } catch (error) {
        console.error(`${guildId}/${buttonName} のボタンデータ保存エラー:`, error);
        return false;
    }
}

// ボタンデータを読み込み
function loadButtonData(guildId, buttonName) {
    try {
        const filePath = path.join(getGuildButtonDirectory(guildId), `${buttonName}.json`);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`${guildId}/${buttonName} のボタンデータ読み込みエラー:`, error);
        return null;
    }
}

// サーバーのすべてのボタン名を取得
function getAllButtonNames(guildId) {
    try {
        const buttonDir = getGuildButtonDirectory(guildId);

        if (!fs.existsSync(buttonDir)) {
            return [];
        }

        const files = fs.readdirSync(buttonDir);
        return files
            .filter(file => file.endsWith('.json'))
            .map(file => path.basename(file, '.json'));
    } catch (error) {
        console.error(`サーバー ${guildId} のボタン名読み込みエラー:`, error);
        return [];
    }
}

// サーバーのすべてのボタンを読み込み
function loadAllButtonsForGuild(guildId) {
    const buttons = {};
    const buttonNames = getAllButtonNames(guildId);

    for (const name of buttonNames) {
        const data = loadButtonData(guildId, name);
        if (data) {
            buttons[name] = data;
        }
    }

    return buttons;
}

// ボタンデータを削除
function deleteButtonData(guildId, buttonName) {
    try {
        const filePath = path.join(getGuildButtonDirectory(guildId), `${buttonName}.json`);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`ボタンデータを削除しました: ${guildId}/${buttonName}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`${guildId}/${buttonName} のボタンデータ削除エラー:`, error);
        return false;
    }
}

module.exports = {
    getDataDirectory,
    getGuildPanelDirectory,
    getGuildButtonDirectory,
    savePanelData,
    loadPanelData,
    getAllPanelNames,
    loadAllPanelsForGuild,
    deletePanelData,
    saveButtonData,
    loadButtonData,
    getAllButtonNames,
    loadAllButtonsForGuild,
    deleteButtonData
};