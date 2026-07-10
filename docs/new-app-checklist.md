# 新アプリ追加チェックリスト

> このチェックリストは、新しいアプリを公開するまでの手順と確認項目をまとめたものです。
> `docs/app-lp-template.md` と併せて参照してください。

## 準備段階

- [ ] アプリ名・スラッグを決定（例: `my-app` → `/apps/my-app/`）
- [ ] ディレクトリ作成（`apps/{slug}/`）
- [ ] `docs/app-lp-template.md` を参照してファイル作成
- [ ] OGP画像を作成（1200×630、`assets/ogp-{slug}.png`）
- [ ] ルートページ `index.html` にカードを追加
  - [ ] カテゴリを設定
  - [ ] ステータスを設定（準備中/構想中）
  - [ ] 構想中は `card--disabled` でリンクなし

## 内容確認

- [ ] 全ページのmetaタグが正しい（title, description, og:*, canonical）
- [ ] `mailto:` リンクが正しい（件名も含めて確認）
- [ ] プライバシーポリシーに記載する外部サービスを確定
- [ ] 利用規約の制定日を更新
- [ ] お問い合わせ先が正しい

## 公開前

- [ ] OGPプレビュー確認（Facebook Sharing Debugger / Twitter Card Validator）
- [ ] レスポンシブ表示確認（スマホ・タブレット）
- [ ] リンク切れ確認
- [ ] ルートページからカードにリンクがあること
