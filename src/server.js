require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ],
    // キャッシュを停止するまで保持（自動削除を無効化）
    sweepers: {
        guildMembers: {
            interval: Infinity, // メンバーキャッシュのスイープを無効化
            filter: () => null
        },
        messages: {
            interval: Infinity, // メッセージキャッシュのスイープを無効化
            filter: () => null
        },
        threads: {
            interval: Infinity, // スレッドキャッシュのスイープを無効化
            filter: () => null
        }
    }
});

client.commands = new Collection();

// コマンドを読み込みとデプロイ
async function loadAndDeployCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');

    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
                console.log(`コマンドを読み込みました: ${command.data.name}`);
            } else {
                console.log(`[警告] ${filePath} のコマンドに必要な "data" または "execute" プロパティがありません。`);
            }
        }
    }

    // コマンドをDiscordにデプロイ
    if (commands.length > 0) {
        try {
            console.log(`${commands.length}個のアプリケーション(/)コマンドのデプロイを開始しました。`);

            const rest = new REST().setToken(process.env.DISCORD_TOKEN);
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );

            console.log(`${data.length}個のアプリケーション(/)コマンドのデプロイが完了しました。`);
        } catch (error) {
            console.error('コマンドデプロイエラー:', error);
        }
    }
}

// コマンドの読み込みとデプロイを実行
loadAndDeployCommands();

// イベントを読み込み
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`イベントを読み込みました: ${event.name}`);
    }
}

// Discordにログイン
client.login(process.env.DISCORD_TOKEN);