# 小さなアプリ工房 — LPサイト

生活、学び、遊び、仕事など、複数ジャンルの個人開発アプリを掲載するポータルです。
ルートページはアプリ一覧、`/apps/{app-slug}/`は各アプリの専用LPとして運用します。

> [!NOTE]
> 「小さなアプリ工房」は仮名称です。正式公開前に最終確認してください。

## 公開環境

- Production URL: `https://lp-5t7.pages.dev`
- Cloudflare Pagesプロジェクト: `lp`
- 配信方式: Direct Upload
- Productionブランチ: `master`
- 自動デプロイ: GitHub Actionsから`wrangler pages deploy`を実行

このサイトはHTML / CSS / JavaScriptのみで構成され、アプリケーションビルドはありません。
CSSやJavaScriptはドメインルート基準の絶対パスで参照しています。

## デプロイ運用

### Productionデプロイ

`master`へのpushで`.github/workflows/deploy.yml`が実行されます。

ワークフローは次の順序で処理します。

1. 公開専用ディレクトリ`_site/`を生成
2. 公開対象だけを`_site/`へコピー
3. Cloudflare Pagesプロジェクト`lp`へデプロイ
4. Production主要URLをスモークテスト

公開対象は次のファイルとディレクトリだけです。

```text
index.html
robots.txt
sitemap.xml
assets/
apps/
```

`.github/`、`README.md`、`docs/`などの開発・運用ファイルは配信しません。

### GitHub Secrets

リポジトリのActions Secretsに次の2件が必要です。

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Secretの値はREADME、Issue、PR、ログへ記載しないでください。

### 手動実行

`Deploy to Cloudflare Pages`は`workflow_dispatch`に対応しています。
空コミットを作らず、GitHub Actions画面から手動実行できます。

### PR検証

サイトまたはワークフローを変更するPRでは、`.github/workflows/validate.yml`が公開物の構成を検証します。

- 必須ファイルが`_site/`へコピーされること
- `assets/`と`apps/`が含まれること
- `.github/`と`README.md`が公開物へ混入しないこと

GitHub Actionsの依存関係は`.github/dependabot.yml`で週次確認します。

## ローカル確認

HTMLファイルを直接開かず、リポジトリルートで静的サーバーを起動してください。

```bash
python -m http.server 8123
```

ブラウザで`http://localhost:8123`へアクセスします。

## ファイル構成

```text
/
├── .github/
│   ├── dependabot.yml                   # GitHub Actions依存更新
│   └── workflows/
│       ├── deploy.yml                   # master→Cloudflare Pages Production
│       └── validate.yml                 # PR用公開物検証
├── index.html                           # ポータル
├── robots.txt                           # クロール設定
├── sitemap.xml                          # 公開URL一覧
├── README.md                            # このファイル
├── assets/
│   ├── styles.css                       # 共通CSS
│   ├── app.js                           # 共通JavaScript
│   ├── favicon.png                      # ファビコン（仮）
│   ├── ogp.png                          # ポータルOGP（仮）
│   ├── ogp-ashita-motsumono.png         # あしたもつものOGP（仮）
│   └── ogp-ehenotane.png                # へぇの種OGP（仮）
├── apps/
│   ├── ashita-motsumono/
│   │   ├── index.html
│   │   ├── privacy.html
│   │   ├── terms.html
│   │   └── contact.html
│   └── ehenotane/
│       ├── index.html
│       ├── privacy.html
│       ├── terms.html
│       └── contact.html
└── docs/
    ├── app-lp-template.md
    └── new-app-checklist.md
```

## URLルール

公開URLはextensionless形式へ統一します。

```text
/apps/{slug}/privacy
/apps/{slug}/terms
/apps/{slug}/contact
```

リポジトリ内の実ファイル名は`privacy.html`、`terms.html`、`contact.html`のまま維持します。
内部リンク、`canonical`、`og:url`、`sitemap.xml`には`.html`を含めません。

## 技術方針

- HTML / CSS / JavaScript
- 外部フロントエンドライブラリなし
- モバイルファースト
- `:focus-visible`、`aria-label`、`prefers-reduced-motion`対応
- title、description、OGP、Twitter Card、canonical対応
- robots.txt / sitemap.xml対応

## 新アプリの追加

新アプリを追加する場合は、`docs/app-lp-template.md`と`docs/new-app-checklist.md`を参照してください。

### ルートカード

- 個別LPあり: `<a href="/apps/{slug}/" class="card card--block">...</a>`
- 構想中: `<div class="card card--disabled">...</div>`

構想中カードにはリンクを付けません。
仕様未確定の機能を説明文で確定させないでください。

凍結したプロジェクトは、過去資料やGit履歴を削除せず、公開中のアプリ一覧から外します。

### アプリディレクトリ

各アプリは`apps/{slug}/`へ配置します。

```text
index.html
privacy.html
terms.html
contact.html
```

新しい公開URLを追加した場合は、次も更新します。

- ルートページのカード
- フッター導線
- `sitemap.xml`
- 必要に応じてOGP画像
- Productionスモークテスト対象

## 公開・運用チェックリスト

### 完了済み

- [x] Production URLで公開
- [x] canonicalと`og:url`をProductionのextensionless URLへ統一
- [x] robots.txtへsitemapを指定
- [x] sitemap.xmlへ公開9 URLを掲載
- [x] GitHub ActionsからCloudflare Pagesへデプロイする構成を追加
- [x] 公開専用ディレクトリ`_site/`を使用
- [x] Production主要URLのスモークテストを追加
- [x] GitHub Actionsをフルcommit SHAへ固定
- [x] Dependabotを設定

### 継続確認

- [ ] GitHub ActionsのProductionデプロイ成功を確認し、Issue #2をClose
- [ ] 正式なサービス名を確定
- [ ] カスタムドメインの要否を決定
- [ ] Google Search Consoleへ登録
- [ ] 正式faviconへ差し替え
- [ ] 正式OGP画像へ差し替え
- [ ] アプリ画面を実機スクリーンショットへ差し替え
- [ ] 問い合わせメールアドレスを正式確認
- [ ] 法務ページをリリース時の実装・外部サービスに合わせて確定
- [ ] App Store / Google Play公開後にストアURLを追加
- [ ] LighthouseをProductionで測定
- [ ] スマホ・タブレット・キーボード操作をリリースごとに確認

## 関連Issue

Cloudflareの旧Workers Builds誤接続と、自動Productionデプロイの最終確認はIssue #2で追跡しています。
