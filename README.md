# 小さなアプリ工房 — LPサイト

生活、学び、遊び、仕事など、複数ジャンルの個人開発アプリを掲載する静的ポータルです。

- ルート: アプリ一覧
- `/apps/{app-slug}/`: アプリ専用LP
- `/apps/{app-slug}/privacy`: プライバシーポリシー
- `/apps/{app-slug}/terms`: 利用規約
- `/apps/{app-slug}/contact`: お問い合わせ

> [!IMPORTANT]
> 「あしたもつもの」の正式名称、問い合わせ先、Production originは`docs/public-identity.md`で管理します。公開表示は「あしたもつもの」、問い合わせ先は`kaenozu@gmail.com`、Production originは`https://lp-5t7.pages.dev`です。

## 公開環境

- Production URL: `https://lp-5t7.pages.dev`
- Cloudflare Pagesプロジェクト: `lp`
- 配信方式: Direct Upload
- Productionブランチ: `master`
- 自動デプロイ: GitHub Actionsの`Deploy to Cloudflare Pages`

HTML、CSS、JavaScriptだけで構成し、フロントエンドフレームワークは使用していません。

## 公開物

`tool/prepare_site.sh`が公開専用ディレクトリ`_site/`を生成します。

```text
index.html
robots.txt
sitemap.xml
_headers
assets/
apps/
```

`.github/`、`docs/`、`tool/`、`README.md`は配信しません。

`_headers`ではCSP、Permissions Policy、Referrer Policy、MIME sniffing防止、frame制限などを設定します。

## アプリmanifest

`tool/site_manifest.json`を公開アプリの単一の定義元として使用します。

manifestで管理する項目:

- URLスラッグ
- アプリごとのOGP画像
- 実画面スクリーンショット
- JavaScript実行後に期待する実画面画像数

`tool/validate_site.py`はmanifestからHTML集合、OGP対応、画像、sitemapを検証します。新しいアプリを追加するとき、HTML数やアプリ名をCIへ個別にハードコードしないでください。

## デプロイ

`master`へのpushで次を実行します。

1. `_site/`を生成
2. 全JavaScriptの構文を確認
3. HTML、画像、canonical、OGP、sitemap、内部リンクを検証
4. Cloudflare Pagesへデプロイ
5. デプロイ固有URLの全公開ページと資産を検証
6. Productionの全公開ページと資産を検証
7. commit statusを記録

記録するStatus:

- `cloudflare-pages-production`
- `cloudflare-pages-brand-verification`
- `production-browser-verification`
- `lighthouse-production`
- `production-accessibility-semantics`

Production検証は`sitemap.xml`に掲載された全ページを対象とします。LPだけでなくprivacy、terms、contactも検査します。

## PR検証

PRではProduction URLではなく、PR headから生成した`_site/`を`127.0.0.1`で配信して検査します。

### 静的検証

`.github/workflows/validate.yml`

- 公開物の許可リスト
- manifestとHTML集合の一致
- 全ページのcanonical、`og:url`、OGP、Twitter Card
- `.html`付き内部リンクの禁止
- PNG／WebPの形式と寸法
- sitemapの完全一致
- 全JavaScriptの構文
- Production監査コードの契約テスト

### ブラウザ検証

`.github/workflows/validate-production-browser.yml`

「あしたもつもの」:

- 実画面4点の表示
- eager／lazy／fetchpriority
- 390px、820px、1440pxの配置
- 横overflow
- キーボードフォーカス
- reduced motion
- JavaScript無効時のHTMLモック
- スクリーンショットCSS失敗時のHTMLモック
- WebP画像失敗時のHTMLモック

「へぇの種」:

- 4択クイズの回答処理
- 正解／不正解表示
- 回答後のフォーカス移動
- 全選択肢の無効化
- noscript表示
- 390px、820px、1440pxの横overflow

### アクセシビリティ検証

`.github/workflows/audit-production-accessibility.yml`

両アプリについて次を確認します。

- `/index.html`直接アクセス
- `html[lang]`
- 見出し階層
- header、main、footer、nav
- リンクのアクセシブルネーム
- Chrome Accessibility Tree
- 画像代替テキスト
- 200%文字拡大
- テキスト欠落と横overflow

PRジョブは`contents: read`のみです。Status書き込みはデプロイ後または手動Production監査の別ジョブに限定します。

## Production定期監査

`.github/workflows/audit-production.yml`はデプロイ成功後、手動実行、毎週月曜日に実行します。

- 両アプリのブラウザ操作
- フォールバック
- Lighthouse mobile／desktop
- 各モード3回測定
- Accessibility 0.95以上
- Best Practices 0.90以上
- SEO 0.90以上
- Performance 0.80未満は警告

レポートとスクリーンショットはGitHub Actions artifactに30日保存し、外部の一時公開ストレージへアップロードしません。

## ローカル確認

```bash
bash tool/prepare_site.sh
python3 tool/validate_site.py _site
python3 -m unittest tool/test_production_audit.py
python3 -m unittest tool/test_production_accessibility_audit.py
python3 -m http.server 8123 --directory _site
```

ブラウザで`http://127.0.0.1:8123`へアクセスします。HTMLファイルを直接開くとルート絶対パスのCSSやJavaScriptを正しく確認できません。

全JavaScriptの構文確認:

```bash
while IFS= read -r -d '' file; do
  node --check "$file"
done < <(find _site tool -type f \( -name '*.js' -o -name '*.cjs' \) -print0 | sort -z)
```

## 主な構成

```text
/
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── deploy.yml
│       ├── validate.yml
│       ├── validate-production-audit.yml
│       ├── validate-production-browser.yml
│       ├── audit-production.yml
│       └── audit-production-accessibility.yml
├── _headers
├── index.html
├── robots.txt
├── sitemap.xml
├── lighthouserc.mobile.cjs
├── lighthouserc.desktop.cjs
├── assets/
│   ├── styles.css
│   ├── app.js
│   ├── app-screenshots.css
│   ├── apps/ashita-motsumono/screenshots/
│   └── brand/
├── apps/
│   ├── ashita-motsumono/
│   └── ehenotane/
├── tool/
│   ├── site_manifest.json
│   ├── prepare_site.sh
│   ├── validate_site.py
│   ├── verify_remote_site.py
│   ├── capture_production_screenshots.cjs
│   ├── audit_screenshot_fallback.cjs
│   ├── audit_ehenotane.cjs
│   ├── audit_production_accessibility.cjs
│   └── test_production_*.py
└── docs/
    ├── app-lp-template.md
    ├── new-app-checklist.md
    ├── production-audit.md
    └── public-identity.md
```

## URLルール

公開URLはextensionless形式へ統一します。

```text
/apps/{slug}/privacy
/apps/{slug}/terms
/apps/{slug}/contact
```

実ファイル名は`privacy.html`、`terms.html`、`contact.html`です。内部リンク、canonical、`og:url`、sitemapに`.html`を含めません。

## 新アプリの追加

`docs/app-lp-template.md`と`docs/new-app-checklist.md`を使用してください。

最低限更新する項目:

- `apps/{slug}/`の4ページ
- `tool/site_manifest.json`
- ルートカード
- `sitemap.xml`
- `assets/brand/og-{slug}.png`
- 操作可能なUIがある場合はPuppeteer監査

## 継続確認

- [ ] Google Search Consoleへ登録
- [ ] 各アプリの公開直前に実装と法務ページを再照合
- [ ] Google Play公開後に正式ストアURLへCTAを変更
- [ ] 実機スマートフォン、タブレット、キーボード操作をリリースごとに確認
