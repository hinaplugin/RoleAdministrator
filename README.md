# WelcomePower Discord Bot

Discord サーバーでロール管理を自動化するボットです。新規メンバーへの自動ロール付与、ロール所有者一覧の表示、ユーザーによるロール切り替えなどの機能を提供します。

## 機能

### 🤖 自動ロール付与
- 新規メンバーがサーバーに参加した際、事前に設定されたロールを自動で付与
- 複数のロールを同時に付与可能
- 複数サーバー対応

### 📋 ロールパネル（新アーキテクチャ）
- 指定したロールの所有者一覧をEmbed形式で表示
- ロールごとに分けて表示（## ロールメンション → メンバー一覧 → メンバー数）
- `/rolepanel create` で動的に作成・設置
- `/rolepanel delete` でパネルとメッセージを削除
- 複数ロール対応（1つのパネルで複数ロール表示可能）
- メンバー数の表示オプション（各ロール個別）
- 自動更新機能（ロールの変更時）
- ファイルベース保存（`<DATA_DIR>/<guildId>/panel/<name>.json`）
- 重複名チェック機能

### 🔘 ロール切り替えボタン（新アーキテクチャ）
- ユーザーがボタンをクリックしてロールのつけ外しが可能
- `/rolebutton create` で動的に作成・設置
- `/rolebutton delete` でボタンとメッセージを削除
- カスタマイズ可能なボタンラベル（オプション、デフォルト設定あり）
- ファイルベース保存（`<DATA_DIR>/<guildId>/button/<name>.json`）
- 重複名チェック機能

### 🛠️ 管理コマンド
- `/help` - ヘルプ情報表示

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
DATA_DIR=./src/data
```

### 4. ボット権限

#### 必須権限

ボットには以下の権限が **必ず** 必要です：

| 権限名 | 日本語名 | 用途 |
|--------|----------|------|
| **Manage Roles** | ロールの管理 | 自動ロール付与・ロールボタン機能 |
| **Send Messages** | メッセージ送信 | ロールパネル・ロールボタンの送信・更新 |
| **Embed Links** | 埋め込みリンク | **ロールパネルの表示に必須** |
| **View Channel** | チャンネルを見る | 基本的なチャンネルアクセス |
| **Read Message History** | メッセージ履歴を読む | パネル更新のためのメッセージ取得 |

#### 推奨権限

以下の権限があるとより快適に動作します：

| 権限名 | 日本語名 | 用途 |
|--------|----------|------|
| **Manage Messages** | メッセージ管理 | パネルの編集・管理 |
| **Use Slash Commands** | スラッシュコマンドの使用 | コマンド実行 |
| **View Server Members** | サーバーメンバーを見る | ロールパネルのメンバー一覧表示 |

#### 権限設定方法

**サーバー全体での設定（推奨）:**
1. サーバー設定 → ロール → ボットのロール
2. 上記の権限をすべて **緑色のチェック（✅）** にする

**チャンネル個別での設定:**
1. 対象チャンネル → 設定 → 権限
2. ボットまたはボットのロールを追加
3. 必要な権限を **許可** にする

#### ⚠️ 重要な注意点

- **「埋め込みリンク」権限がないとロールパネルが表示されません**
- チャンネルレベルの権限がサーバーレベルの権限を上書きします
- カテゴリチャンネルの権限は子チャンネルに継承されます
- 権限が不足している場合、コンソールに詳細なエラーメッセージが表示されます

#### トラブルシューティング

**ロールパネルが表示されない場合:**
1. ボットに「埋め込みリンク」権限があるか確認
2. 対象チャンネルでの権限オーバーライドを確認
3. コンソールのエラーログを確認

### 5. 設定ファイルの準備

```bash
# sample-config.jsonを参考にconfig.jsonを作成
cp src/sample-config.json src/config.json
# config.jsonを編集して実際のサーバーIDとロールIDを設定
```

### 6. 起動

ボットを起動すると、**自動的にコマンドがDiscordにデプロイされます**：

```bash
# 本番環境
npm start

# 開発環境（ファイル変更時自動再起動）
npm run dev
```

**Note**: 従来の手動デプロイコマンド（`npm run deploy`）は不要になりました。ボット起動時に自動的に最新のコマンドがDiscordに登録されます。

## 設定

### 設定ファイルの構造

設定ファイルのパスは環境変数 `CONFIG_PATH` で指定できます（デフォルト: `./src/config.json`）

**新アーキテクチャでは、パネルとボタンは動的作成されるため、設定ファイルには基本設定のみを記載します：**

```json
{
  "servers": {
    "YOUR_SERVER_ID": {
      "autoRole": {
        "enabled": true,
        "roleIds": ["ROLE_ID_1", "ROLE_ID_2"]
      },
      "defaultButtonSettings": {
        "joinLabel": "参加",
        "leaveLabel": "退出",
        "joinEmoji": "✅",
        "leaveEmoji": "❌"
      }
    }
  }
}
```

### データ保存

- **環境変数**: `DATA_DIR`でデータ保存場所を指定（デフォルト: `./src/data`）
- **パネルデータ**: `<DATA_DIR>/<guildId>/panel/<name>.json`
- **ボタンデータ**: `<DATA_DIR>/<guildId>/button/<name>.json`
- **サーバー分離**: 各Discordサーバーごとにディレクトリが作成されます

### 設定のカスタマイズ

1. `src/sample-config.json` を参考に `src/config.json` を作成・編集
2. サーバーIDを実際のサーバーIDに変更
3. 自動ロール付与のロールIDを設定
4. デフォルトボタン設定をカスタマイズ（オプション）

## 使用方法

### 基本コマンド

#### パネル管理
- `/rolepanel create roles:@Admin @Moderator name:staff title:"スタッフ一覧" message:"スタッフロールを持つメンバーの一覧です"` - スタッフパネルを作成
- `/rolepanel delete name:staff` - スタッフパネルを削除
- `/rolepanel info` - 全パネルの一覧を表示
- `/rolepanel info name:staff` - スタッフパネルの詳細情報を表示

#### ボタン管理
- `/rolebutton create role:@通知 name:notification message:"通知設定を変更できます"` - 通知ボタンを作成
- `/rolebutton create role:@開発者 name:dev message:"開発チームです" joinlabel:"参加する" leavelabel:"退出する"` - カスタムラベルでボタンを作成
- `/rolebutton delete name:notification` - 通知ボタンを削除
- `/rolebutton info` - 全ボタンの一覧を表示
- `/rolebutton info name:notification` - 通知ボタンの詳細情報を表示

#### その他
- `/help` - ヘルプを表示

### 使用例

1. **複数ロールのパネルを作成**:
   ```
   /rolepanel create roles:@管理者 @モデレーター name:staff title:"スタッフ一覧" message:"管理・運営を行うメンバーです"
   ```

2. **ロール切り替えボタンを作成**:
   ```
   /rolebutton create role:@通知 name:notify message:"通知を受け取るかどうか設定できます"
   ```

3. **カスタムラベルのボタンを作成**:
   ```
   /rolebutton create role:@イベント参加者 name:event message:"イベントに参加する場合はボタンを押してください" joinlabel:"参加します" leavelabel:"不参加"
   ```

### 権限要件

すべてのコマンドはサーバー管理権限を持つユーザーのみが使用できます。

## 技術仕様

- **言語**: JavaScript
- **ランタイム**: Node.js v22
- **フレームワーク**: discord.js v14
- **設定管理**: JSON
- **環境変数管理**: dotenv
- **コマンドデプロイ**: 自動化（ボット起動時）

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