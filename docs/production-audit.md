# Production表示・Lighthouse・アクセシビリティ監査

Production URL `https://lp-5t7.pages.dev/apps/ashita-motsumono/` を、次のworkflowで継続確認します。

- `.github/workflows/audit-production.yml`: 表示、フォールバック、キーボード、Lighthouse
- `.github/workflows/audit-production-accessibility.yml`: 直接アクセス、文書構造、Accessibility Tree、200%テキスト拡大

## 実行タイミング

- `Deploy to Cloudflare Pages`が成功した後
- GitHub Actionsからの手動実行
- 表示監査は毎週月曜日にも定期実行
- 関連するPRでは、PR headの監査コードをProductionへ適用してマージ前に確認

デプロイ失敗時は監査を実行せず、既存の`cloudflare-pages-production` Statusを正とします。

## ブラウザ確認

GitHub-hosted runnerのChromeを`puppeteer-core@25.3.0`から操作します。Runnerへ`fonts-noto-cjk`を導入し、監査画像でも日本語を表示できる状態にしてから確認します。

### 実画面とレスポンシブ配置

- JavaScript実行後に実装画面4点（先頭1点＋下部3点）が表示される
- 先頭画像が`loading="eager"`かつ`fetchpriority="high"`である
- 下部画像3点が`loading="lazy"`である
- 4画像が360×640で読み込まれている
- すべての画像に空でないaltテキストがある
- モバイル390px幅では下部3画面が1列
- タブレット820px幅では下部3画面が2列
- PC 1440px幅では下部3画面が3列
- 各幅でページ全体の横スクロールが発生していない

列数はCSSの算出値だけでなく、各カードの実座標からも確認します。下部画面の証跡は`.screenshot-grid`要素自体を撮影するため、ページ内スクロール位置に依存しません。

### フォールバックとキーボード

- スクリプトを実行していない配信HTMLに`phone-mock`4点が残る
- スクリプトを実行していない配信HTMLに実画面画像が注入されていない
- `/assets/app-screenshots.css`の読み込みを失敗させた場合も`phone-mock`4点が残る
- キーボードのTab操作で主要ナビゲーションへ到達できる
- `:focus-visible`で可視のアウトラインが表示される
- `prefers-reduced-motion: reduce`でアニメーション時間が短縮され、スムーススクロールが無効になる

### 文書構造とAccessibility Tree

- `/apps/ashita-motsumono/index.html`からアクセスしても実画面4点へ置換される
- `html[lang]`が日本語である
- 文書タイトルが空でない
- `h1`が1件で、見出しレベルに飛びがない
- `header`、`main`、`footer`が各1件ある
- ヘッダーとフッターの`nav`に空でない一意のラベルがある
- すべてのリンクにアクセス可能な名前がある
- Chrome Accessibility Tree上に画像の代替テキスト4点が公開される
- Accessibility Tree上にbanner、main、contentinfo、navigation、名前付きレベル1見出しがある

### 200%テキスト拡大

W3C WCAG 2.2のResize Textを基準に、ルート文字サイズを200%へ変更して次を確認します。

- 主要セクションが表示されたままである
- ページ全体に横方向overflowがない
- `overflow: hidden`または`clip`によるテキスト欠落がない
- 全ページ画像と実測JSONを保存する

## 画像証跡

- モバイル幅の先頭表示と下部3画面
- タブレット幅の先頭表示と下部3画面
- PC幅の先頭表示と下部3画面
- キーボードフォーカス表示
- 実画面専用CSS読み込み失敗時の先頭表示と下部HTMLモック
- `index.html`直接アクセス時の表示
- 200%テキスト拡大時の全ページ表示

## Lighthouse

`@lhci/cli@0.15.1`を固定して、モバイルとデスクトップを各1回測定します。

記録するカテゴリ:

- Performance
- Accessibility
- Best Practices
- SEO

導入直後は実測値を取得する段階とし、未確認の閾値でProduction監査を失敗させません。基準値を決める場合は、複数回の実測と変動幅を確認した後に別PRで追加します。

## 証跡

Actions artifact `production-lp-audit`へ表示・Lighthouse証跡を30日間保存します。

- モバイル／デスクトップLighthouse HTML・JSON
- `lighthouse-summary.json`
- 各幅のChromeスクリーンショット
- 各幅の配置座標と列数JSON
- キーボードフォーカス結果
- reduced motion結果
- JavaScript実行後のDOM
- スクリプト未実行の配信HTML
- 実画面専用CSS読み込み失敗時のDOMと画像
- 日本語フォントの`fc-match`結果

Actions artifact `production-accessibility-audit`へ文書・Accessibility Tree・200%拡大証跡を30日間保存します。

- `index-html-access.json`とPNG
- `accessibility-semantics.json`
- `text-resize-200.json`と全ページPNG
- 日本語フォントの`fc-match`結果

Lighthouseレポートは`filesystem`へ出力し、外部の一時公開ストレージへアップロードしません。

## Commit Status

監査対象のcommitへ次を記録します。

- `production-browser-verification`
- `lighthouse-production`
- `production-accessibility-semantics`

Statusのリンク先は該当するGitHub Actions runです。
