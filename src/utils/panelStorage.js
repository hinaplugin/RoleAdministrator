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

// サーバーのメニューディレクトリを取得
function getGuildMenuDirectory(guildId) {
    return path.join(getDataDirectory(), guildId, 'menu');
}

// ディレクトリの存在を確認
function ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// パネル名の重複チェック
function isPanelNameExists(guildId, panelName) {
    try {
        const filePath = path.join(getGuildPanelDirectory(guildId), `${panelName}.json`);
        return fs.existsSync(filePath);
    } catch (error) {
        console.error(`パネル名重複チェックエラー: ${guildId}/${panelName}:`, error);
        return false;
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

// ボタン名の重複チェック
function isButtonNameExists(guildId, buttonName) {
    try {
        const filePath = path.join(getGuildButtonDirectory(guildId), `${buttonName}.json`);
        return fs.existsSync(filePath);
    } catch (error) {
        console.error(`ボタン名重複チェックエラー: ${guildId}/${buttonName}:`, error);
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

// メニュー名の重複チェック
function isMenuNameExists(guildId, menuName) {
    try {
        const filePath = path.join(getGuildMenuDirectory(guildId), `${menuName}.json`);
        return fs.existsSync(filePath);
    } catch (error) {
        console.error(`メニュー名重複チェックエラー: ${guildId}/${menuName}:`, error);
        return false;
    }
}

// メニューデータを保存
function saveMenuData(guildId, menuName, menuData) {
    try {
        const menuDir = getGuildMenuDirectory(guildId);
        ensureDirectory(menuDir);

        const filePath = path.join(menuDir, `${menuName}.json`);
        const dataToSave = {
            ...menuData,
            updatedAt: new Date().toISOString()
        };

        fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
        console.log(`メニューデータを保存しました: ${guildId}/${menuName}`);
        return true;
    } catch (error) {
        console.error(`${guildId}/${menuName} のメニューデータ保存エラー:`, error);
        return false;
    }
}

// メニューデータを読み込み
function loadMenuData(guildId, menuName) {
    try {
        const filePath = path.join(getGuildMenuDirectory(guildId), `${menuName}.json`);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`${guildId}/${menuName} のメニューデータ読み込みエラー:`, error);
        return null;
    }
}

// サーバーのすべてのメニュー名を取得
function getAllMenuNames(guildId) {
    try {
        const menuDir = getGuildMenuDirectory(guildId);

        if (!fs.existsSync(menuDir)) {
            return [];
        }

        const files = fs.readdirSync(menuDir);
        return files
            .filter(file => file.endsWith('.json'))
            .map(file => path.basename(file, '.json'));
    } catch (error) {
        console.error(`サーバー ${guildId} のメニュー名読み込みエラー:`, error);
        return [];
    }
}

// サーバーのすべてのメニューを読み込み
function loadAllMenusForGuild(guildId) {
    const menus = {};
    const menuNames = getAllMenuNames(guildId);

    for (const name of menuNames) {
        const data = loadMenuData(guildId, name);
        if (data) {
            menus[name] = data;
        }
    }

    return menus;
}

// メニューデータを削除
function deleteMenuData(guildId, menuName) {
    try {
        const filePath = path.join(getGuildMenuDirectory(guildId), `${menuName}.json`);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`メニューデータを削除しました: ${guildId}/${menuName}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`${guildId}/${menuName} のメニューデータ削除エラー:`, error);
        return false;
    }
}

module.exports = {
    getDataDirectory,
    getGuildPanelDirectory,
    getGuildButtonDirectory,
    getGuildMenuDirectory,
    isPanelNameExists,
    savePanelData,
    loadPanelData,
    getAllPanelNames,
    loadAllPanelsForGuild,
    deletePanelData,
    isButtonNameExists,
    saveButtonData,
    loadButtonData,
    getAllButtonNames,
    loadAllButtonsForGuild,
    deleteButtonData,
    isMenuNameExists,
    saveMenuData,
    loadMenuData,
    getAllMenuNames,
    loadAllMenusForGuild,
    deleteMenuData
};