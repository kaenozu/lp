# Production表示・Lighthouse監査

Production URL `https://lp-5t7.pages.dev/apps/ashita-motsumono/` の表示とLighthouseを、`.github/workflows/audit-production.yml`で継続確認します。

## 実行タイミング

- `Deploy to Cloudflare Pages`が成功した後
- GitHub Actionsからの手動実行
- 毎週月曜日の定期実行

デプロイ失敗時は監査を実行せず、既存の`cloudflare-pages-production` Statusを正とします。

## ブラウザ確認

GitHub-hosted runnerのChromeとProductionから直接取得したHTMLを使用して、次を確認します。

- JavaScript実行後に実装画面4点（先頭1点＋下部3点）が表示される
- 先頭画像が`loading="eager"`かつ`fetchpriority="high"`である
- 下部画像が`loading="lazy"`である
- スクリプトを実行していない配信HTMLに`phone-mock`4点が残る
- スクリプトを実行していない配信HTMLに実画面画像が注入されていない

次の表示証跡をPNGで保存します。

- モバイル幅の先頭表示
- モバイル幅の実画面セクション
- タブレット幅の実画面セクション
- PC幅の先頭表示
- PC幅の実画面セクション

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
- Chromeスクリーンショット
- JavaScript実行後のDOM
- スクリプト未実行の配信HTML

Lighthouseレポートは`filesystem`へ出力し、外部の一時公開ストレージへアップロードしません。

## Commit Status

監査対象のcommitへ次を記録します。

- `production-browser-verification`
- `lighthouse-production`

Statusのリンク先は該当するGitHub Actions runです。
