# 新アプリ追加チェックリスト

`docs/app-lp-template.md`と併せて使用します。

## 構成

- [ ] アプリ名とURLスラッグを決定
- [ ] `apps/{slug}/`に`index.html`、`privacy.html`、`terms.html`、`contact.html`を作成
- [ ] `tool/site_manifest.json`へアプリ定義を追加
- [ ] `assets/brand/og-{slug}.png`を1200×630 PNGで作成
- [ ] 実画面を使う場合は`assets/apps/{slug}/screenshots/`へ配置
- [ ] ルート`index.html`へカードを追加
- [ ] `sitemap.xml`へ4 URLを追加

## URLとメタデータ

- [ ] 内部リンクに`.html`が含まれていない
- [ ] canonicalと`og:url`が各ページのextensionless URLになっている
- [ ] `og:image`と`twitter:image`が`assets/brand/og-{slug}.png`を指している
- [ ] title、description、OGP、Twitter Card、faviconが全4ページにある
- [ ] 外部リンクの`target="_blank"`に`rel="noopener noreferrer"`がある

## 内容と法務

- [ ] LPの機能説明が実装済み・公開予定の仕様と一致している
- [ ] 料金、広告、課金、分析、外部送信を断定する場合は実装と一致している
- [ ] プライバシーポリシーに利用サービス、処理情報、目的、削除方法を記載
- [ ] 利用規約の免責条項を適用法令で認められる範囲に限定
- [ ] 公開ページからTODO、仮メールアドレス、未確定のサービス名を除去
- [ ] 問い合わせ先とmailto件名を確認
- [ ] 制定日・最終改定日を更新

## 検証

- [ ] `bash tool/prepare_site.sh`
- [ ] `python3 tool/validate_site.py _site`
- [ ] 全JavaScriptに`node --check`を実行
- [ ] 操作可能なUIにはPuppeteer監査を追加
- [ ] JavaScript無効時と画像・CSS障害時のフォールバックを確認
- [ ] 390px、820px、1440pxで横スクロールがない
- [ ] キーボード操作、`:focus-visible`、200%文字拡大を確認
- [ ] Lighthouseをモバイル・デスクトップ各3回実行

## 公開後

- [ ] 全sitemap URLがHTTP成功し、canonical／OGPがソースと一致する
- [ ] Productionのセキュリティヘッダーを確認
- [ ] Search Consoleへsitemapを送信
- [ ] ストア公開後に主要CTAを正式ストアURLへ変更
