# 個人開発アプリ置き場 — LPサイト

「あしたもつもの」の紹介LPを含む、個人開発アプリの静的サイトです。

## 配信前提

このサイトは **Cloudflare Pages などでドメイン直下に公開する前提** で作られています。
全ファイルの CSS/JS 参照は絶対パス（`/assets/styles.css`）で記述されています。

### Cloudflare Pages 公開設定例

| 項目 | 設定値 |
|---|---|
| Framework preset | None |
| Build command | （空） |
| Build output directory | `/` |
| Root directory | `/` |

上記設定でリポジトリを接続するだけで公開できます。

### ローカル確認方法

HTML ファイルを直接ダブルクリックして開くのではなく、以下のように静的サーバーを起動して確認してください。

```bash
# Python 3 を使う場合
python -m http.server 8123
```

表示後、ブラウザで `http://localhost:8123` にアクセスしてください。

## ファイル構成

```
/
├── index.html                          # ルートページ（アプリ一覧）
├── README.md                           # このファイル
├── assets/
│   ├── styles.css                      # 共通CSS
│   ├── app.js                          # JavaScript（年表示のみ）
│   ├── favicon.png                     # ファビコン（仮）
│   ├── ogp.png                         # OGP画像（ルートページ用、仮）
│   └── ogp-ashita-motsumono.png        # OGP画像（アプリLP用、仮）
└── apps/ashita-motsumono/
    ├── index.html                      # アプリ紹介LP
    ├── privacy.html                    # プライバシーポリシー
    ├── terms.html                      # 利用規約
    └── contact.html                    # お問い合わせ
```

## 技術スタック

- HTML / CSS / JavaScript（外部ライブラリ不使用）
- モバイルファースト
- アクセシビリティ対応（`:focus-visible`, `aria-label`, `prefers-reduced-motion`）
- SEO メタタグ（title, description, OGP, Twitter Card, canonical）対応済み

## 公開前チェックリスト

本番公開前に、以下の項目を確認・修正してください。

### ドメイン・メタ情報

- [ ] 本番ドメインを設定する（Cloudflare Pages のカスタムドメイン）
- [ ] `og:url` を本番ドメインに変更する（全ページ）
- [ ] `canonical` を本番ドメインに変更する（全ページ）
- [ ] `og:image` の画像を本番ドメインのものに変更する（全ページ）
- [ ] Google Search Console に登録する

### 画像・アイコン

- [ ] favicon を正式版アイコンに差し替える（`assets/favicon.png`）
- [ ] OGP画像（ルートページ用）を正式版に差し替える（`assets/ogp.png`）
- [ ] OGP画像（アプリLP用）を正式版に差し替える（`assets/ogp-ashita-motsumono.png`）
- [ ] スマホモックを実機スクリーンショットに差し替える（`apps/ashita-motsumono/index.html` の `.phone-mock` と `.screenshot-grid`）

### お問い合わせ

- [ ] 問い合わせメールアドレスを本番用に変更する（`mailto:` リンク全般）
- [ ] `privacy.html` / `terms.html` / `contact.html` のお問い合わせ表記を正式化する

### 法務ページ

- [ ] `privacy.html` を正式化する
  - 「外部サービスが確定した際は本ページに追記します」の箇所を、実際に利用するサービス名に書き換える
  - サービスが未確定の場合はそのままでもよいが、リリース時までには確定させる
- [ ] `terms.html` を正式化する
  - リリース日前後に「初版制定日」を更新する
  - 必要に応じて管轄裁判所などを追記する

### ストア情報

- [ ] App Store URL を追加する（リリース後）
- [ ] Google Play URL を追加する（リリース後）
- [ ] ストア未公開のまま「ダウンロード」ボタンを表示しないことを確認する

### 外部サービス

- [ ] 実際に利用する外部サービス（Firebase Analytics、Crashlytics、AdMob など）の有無を確認する
- [ ] 利用する場合は `privacy.html` にサービス名・提供元・取得データ・目的を明記する
- [ ] 利用しない場合は「利用する場合があります」の表現を削除または調整する

### 表示確認

- [ ] スマホ表示でナビゲーションとCTAが自然に表示されることを確認する
- [ ] タブレット表示で崩れがないことを確認する
- [ ] OGPプレビュー（Facebook Sharing Debugger / Twitter Card Validator）で正しく表示されることを確認する
- [ ] フォーカス移動（Tabキー操作）で全リンク・ボタンにフォーカスが当たることを確認する
- [ ] ダークモードで最低限読めることを確認する（`prefers-color-scheme` 未対応の場合は白背景が維持されることを確認）

### コンテンツ

- [ ] 固定日付（「7月9日」など）が残っていないことを確認する
- [ ] 仮情報（`example.com` など）が残っていないことを確認する
- [ ] 誇大表現（「完全に防ぐ」「必ず」など）が残っていないことを確認する
