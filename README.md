# WelcomePower Discord Bot

Discord サーバーでロール管理を自動化するボットです。新規メンバーへの自動ロール付与、ロール所有者一覧の表示、ユーザーによるロール切り替えなどの機能を提供します。

## 機能

### 🤖 自動ロール付与
- 新規メンバーがサーバーに参加した際、事前に設定されたロールを自動で付与
- 複数のロールを同時に付与可能
- 複数サーバー対応

### 📋 ロールパネル
- 指定したロールの所有者一覧をEmbed形式で表示
- ロールごとに分けて表示（## ロールメンション → メンバー一覧 → メンバー数）
- `/rolepanel <panelName>` で召喚
- 複数ロール対応（1つのパネルで複数ロール表示可能）
- メンバー数の表示オプション（各ロール個別）
- 自動更新機能（ロールの変更時）

### 🔘 ロール切り替えボタン
- ユーザーがボタンをクリックしてロールのつけ外しが可能
- `/rolebutton <buttonName>` で設置
- カスタマイズ可能なボタンラベルと絵文字

### 🛠️ 管理コマンド
- `/help` - ヘルプ情報表示
- `/reload` - 設定ファイル再読み込み

## セットアップ

### 1. 必要な環境
- Node.js v22 以降
- Discord Bot Token
- Discord Application Client ID

### 2. インストール

```bash
# リポジトリをクローン
git clone https://github.com/hinaplugin/RoleAdministrator.git
cd WelcomePower

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env
# .env ファイルを編集してトークンとクライアントIDを設定
```

### 3. 環境変数の設定

`.env` ファイルに以下を設定：

```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_application_client_id_here
CONFIG_PATH=./src/config.json
```

### 4. ボット権限

ボットには以下の権限が必要です：
- **ロールの管理** - 自動ロール付与とロールボタンに必要
- **メッセージ送信** - ロールパネルとロールボタンの送信・更新に必要
- **メッセージ管理** - ロールパネルの編集に推奨（必須ではない）
- **スラッシュコマンドの使用** - コマンドの実行に必要
- **Embed リンク** - ロールパネルのEmbed表示に必要
- **サーバーメンバーを見る** - ロールパネルのメンバー一覧表示に必要

**重要**: ロールパネルが設置されるチャンネルで、ボットに「メッセージ送信」権限を付与してください。権限がない場合、パネルの更新が失敗します。

### 5. 設定ファイルの準備

```bash
# sample-config.jsonを参考にconfig.jsonを作成
cp src/sample-config.json src/config.json
# config.jsonを編集して実際のサーバーIDとロールIDを設定
```

### 6. スラッシュコマンドのデプロイ

```bash
npm run deploy
```

### 7. 起動

```bash
# 本番環境
npm start

# 開発環境（ファイル変更時自動再起動）
npm run dev
```

## 設定

### 設定ファイルの構造

設定ファイルのパスは環境変数 `CONFIG_PATH` で指定できます（デフォルト: `./src/config.json`）

```json
{
  "servers": {
    "YOUR_SERVER_ID": {
      "autoRole": {
        "enabled": true,
        "roleIds": ["ROLE_ID_1", "ROLE_ID_2"]
      },
      "rolePanels": {
        "admin": {
          "channelId": null,
          "messageId": null,
          "roleIds": ["ADMIN_ROLE_ID"],
          "title": "管理者一覧",
          "description": "管理者ロールを持っているメンバーの一覧です",
          "showCount": true
        },
        "staff": {
          "channelId": null,
          "messageId": null,
          "roleIds": ["ADMIN_ROLE_ID", "MODERATOR_ROLE_ID"],
          "title": "スタッフ一覧",
          "description": "管理者・モデレーターロールを持っているメンバーの一覧です",
          "showCount": true
        }
      },
      "roleButtons": {
        "notification": {
          "channelId": null,
          "messageId": null,
          "roleId": "NOTIFICATION_ROLE_ID",
          "message": "通知設定を変更できます。",
          "joinLabel": "通知ON",
          "leaveLabel": "通知OFF",
          "joinEmoji": "🔔",
          "leaveEmoji": "🔕"
        }
      }
    }
  }
}
```

### 設定のカスタマイズ

1. `src/sample-config.json` を参考に `src/config.json` を作成・編集
2. サーバーIDを実際のサーバーIDに変更
3. ロールIDを実際のロールIDに変更
4. 複数ロールのパネルは `roleIds` 配列で指定
5. `/reload` コマンドで設定を再読み込み

## 使用方法

### 基本コマンド

- `/help` - ヘルプを表示
- `/rolepanel admin` - 管理者パネルを召喚
- `/rolepanel staff` - スタッフパネルを召喚（複数ロール対応例）
- `/rolebutton notification` - 通知ボタンを設置
- `/reload` - 設定を再読み込み

### 権限要件

すべてのコマンドはサーバー管理権限を持つユーザーのみが使用できます。

## 技術仕様

- **言語**: JavaScript
- **ランタイム**: Node.js v22
- **フレームワーク**: discord.js v14
- **設定管理**: JSON
- **環境変数管理**: dotenv

## プロジェクト情報

- **作者**: hina_mikan
- **ライセンス**: Apache-2.0
- **キーワード**: discord, bot, role, panel

## ライセンス

Apache-2.0 License

## 貢献

プルリクエストや issue の作成を歓迎します。

## サポート

問題が発生した場合は、GitHub の Issues をご利用ください。