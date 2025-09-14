# WelcomePower Discord Bot

Discord サーバーでロール管理を自動化するボットです。新規メンバーへの自動ロール付与、ロール所有者一覧の表示、ユーザーによるロール切り替えなどの機能を提供します。

## 機能

### 🤖 自動ロール付与
- 新規メンバーがサーバーに参加した際、事前に設定されたロールを自動で付与
- 複数のロールを同時に付与可能
- 複数サーバー対応

### 📋 ロールパネル
- 指定したロールの所有者一覧をEmbed形式で表示
- `/rolepanel <panelName>` で召喚
- メンバー数の表示オプション
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
```

### 4. ボット権限

ボットには以下の権限が必要です：
- ロールの管理
- メッセージ送信
- スラッシュコマンドの使用
- Embed リンク
- サーバーメンバーを見る

### 5. スラッシュコマンドのデプロイ

```bash
npm run deploy
```

### 6. 起動

```bash
# 本番環境
npm start

# 開発環境（ファイル変更時自動再起動）
npm run dev
```

## 設定

### config.json の構造

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
          "roleId": "ADMIN_ROLE_ID",
          "title": "管理者一覧",
          "description": "管理者ロールを持っているメンバーの一覧です",
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

1. `src/config.json` を編集
2. サーバーIDを実際のサーバーIDに変更
3. ロールIDを実際のロールIDに変更
4. `/reload` コマンドで設定を再読み込み

## 使用方法

### 基本コマンド

- `/help` - ヘルプを表示
- `/rolepanel admin` - 管理者パネルを召喚
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

## ライセンス

ISC License

## 貢献

プルリクエストや issue の作成を歓迎します。

## サポート

問題が発生した場合は、GitHub の Issues をご利用ください。