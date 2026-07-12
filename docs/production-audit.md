# Production表示・Lighthouse監査

Production URL `https://lp-5t7.pages.dev/apps/ashita-motsumono/` の表示とLighthouseを、`.github/workflows/audit-production.yml`で継続確認します。

## 実行タイミング

- `Deploy to Cloudflare Pages`が成功した後
- GitHub Actionsからの手動実行
- 毎週月曜日の定期実行

デプロイ失敗時は監査を実行せず、既存の`cloudflare-pages-production` Statusを正とします。

## ブラウザ確認

GitHub-hosted runnerのChromeを`puppeteer-core@25.3.0`から操作します。Runnerへ`fonts-noto-cjk`を導入し、監査画像でも日本語を表示できる状態にしてから次を確認します。

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

### フォールバックとアクセシビリティ

- スクリプトを実行していない配信HTMLに`phone-mock`4点が残る
- スクリプトを実行していない配信HTMLに実画面画像が注入されていない
- `/assets/app-screenshots.css`の読み込みを失敗させた場合も`phone-mock`4点が残る
- キーボードのTab操作で主要ナビゲーションへ到達できる
- `:focus-visible`で可視のアウトラインが表示される
- `prefers-reduced-motion: reduce`でアニメーション時間が短縮され、スムーススクロールが無効になる

### 画像証跡

- モバイル幅の先頭表示と下部3画面
- タブレット幅の先頭表示と下部3画面
- PC幅の先頭表示と下部3画面
- キーボードフォーカス表示
- 実画面専用CSS読み込み失敗時の先頭表示と下部HTMLモック

## Lighthouse

`@lhci/cli@0.15.1`を固定して、モバイルとデスクトップを各1回測定します。

記録するカテゴリ:

- Performance
- Accessibility
- Best Practices
- SEO

導入直後は実測値を取得する段階とし、未確認の閾値でProduction監査を失敗させません。基準値を決める場合は、複数回の実測と変動幅を確認した後に別PRで追加します。

## 証跡

Actions artifact `production-lp-audit`へ次を30日間保存します。

- モバイルLighthouse HTML / JSON
- デスクトップLighthouse HTML / JSON
- `lighthouse-summary.json`
- 各幅のChromeスクリーンショット
- 各幅の配置座標と列数JSON
- キーボードフォーカス結果
- reduced motion結果
- JavaScript実行後のDOM
- スクリプト未実行の配信HTML
- 実画面専用CSS読み込み失敗時のDOMと画像
- 日本語フォントの`fc-match`結果

Lighthouseレポートは`filesystem`へ出力し、外部の一時公開ストレージへアップロードしません。

## Commit Status

監査対象のcommitへ次を記録します。

- `production-browser-verification`
- `lighthouse-production`

Statusのリンク先は該当するGitHub Actions runです。
