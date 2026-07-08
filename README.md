# 個人開発アプリ置き場 — LPサイト

「あしたもつもの」の紹介LPを含む、個人開発アプリの静的サイトです。

## 配信前提

このサイトは **Cloudflare Pages などでドメイン直下に公開する前提** で作られています。
全ファイルの CSS/JS 参照は絶対パス（`/assets/styles.css`）で記述されています。

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
│   ├── app.js                          # JavaScript
│   ├── favicon.png                     # ファビコン（仮）
│   ├── ogp.png                         # OGP画像（ルートページ用、仮）
│   └── ogp-ashita-motsumono.png        # OGP画像（アプリLP用、仮）
└── apps/ashita-motsumono/
    ├── index.html                      # アプリ紹介LP
    ├── privacy.html                    # プライバシーポリシー
    ├── terms.html                      # 利用規約
    └── contact.html                    # お問い合わせ
```

## 本番公開前に置き換えるもの

| 項目 | 現在の値 | 置き換え先 |
|---|---|---|
| ドメイン | `https://example.com/` | 実際の公開ドメイン |
| 問い合わせメール | `example@example.com` | 実際の受付メールアドレス |
| App Store URL | 未設定 | リリース後に追加 |
| Google Play URL | 未設定 | リリース後に追加 |
| ファビコン | `assets/favicon.png`（仮） | 正式版アイコン |
| OGP画像（ルート） | `assets/ogp.png`（仮） | 正式版OGP画像 |
| OGP画像（アプリLP） | `assets/ogp-ashita-motsumono.png`（仮） | 正式版OGP画像 |
| プライバシーポリシー | 仮文言 | 外部サービス名を確定後に正式化 |
| 利用規約 | 仮文言 | 正式化 |
| スクリーンショット | CSSモック | 実機スクリーンショット |

## 技術スタック

- HTML / CSS / JavaScript（外部ライブラリ不使用）
- モバイルファースト
- アクセシビリティ対応
- SEO メタタグ（title, description, OGP, Twitter Card, canonical）対応済み
