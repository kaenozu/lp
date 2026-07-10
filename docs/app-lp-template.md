# アプリLPテンプレート

> このファイルは、新アプリのランディングページ（LP）を作成する際のテンプレートです。
> 既存の `apps/ashita-motsumono/` を参照に、必要なファイルと変更箇所をまとめています。

## ディレクトリ構成テンプレート

新アプリのスラッグを `my-app` とした場合：

```
apps/
└── my-app/
    ├── index.html        # アプリ紹介LP（メインページ）
    ├── privacy.html      # プライバシーポリシー
    ├── terms.html        # 利用規約
    └── contact.html      # お問い合わせ
```

assets/ 以下は全アプリで共通です。
OGP画像は `assets/ogp-my-app.png` のようにアプリごとに用意します。

## 必須ファイル一覧

| ファイル | 役割 |
|---|---|
| `index.html` | アプリの紹介LP。特徴、使い方、FAQ、CTAを配置するメインページ |
| `privacy.html` | プライバシーポリシー。外部サービスやデータ取得の扱いを明記 |
| `terms.html` | 利用規約。利用条件、禁止事項、免責事項を記載 |
| `contact.html` | お問い合わせページ。リリース情報受け取りや要望送信用の導線を設置 |

## 各ファイルの役割

### index.html
- ファーストビュー：アプリ名とキャッチコピー
- 特徴セクション：どのような課題を解決するか
- 使い方セクション：利用ステップの説明
- 画面イメージ：モックアップやスクリーンショット
- FAQ：よくある質問と回答
- CTA：リリース情報受け取りやお問い合わせへの誘導

### privacy.html / terms.html / contact.html
- アプリ名とポリシー名を明記
- 更新日（制定日）を記載
- 外部サービスを利用する場合は、サービス名・提供元・取得データ・目的を明記
- お問い合わせ導線を設置

## OGP画像の仕様

- ファイル名：`assets/ogp-{slug}.png`
  - 例：`assets/ogp-ashita-motsumono.png`
- サイズ：1200×630（横長）
- 形式：PNG
- 配置場所：`/assets/` 直下
- ルートページ用の `assets/ogp.png` とは別に、各アプリ専用のOGP画像を用意する

## 共通CSS/JSの参照方法

全ページで以下のパスを絶対パスで参照する：

```html
<link rel="stylesheet" href="/assets/styles.css">
<script src="/assets/app.js"></script>
```

Cloudflare Pages などの静的ホスティングでドメイン直下に公開する前提のため、
必ず先頭に `/` をつけた絶対パスで記述すること。

## ナビゲーションのパターン

### header の構成例

```html
<header class="header">
  <div class="container header__inner">
    <a href="/apps/{slug}/" class="header__logo">{アプリ名}</a>
    <nav class="header__nav" aria-label="メインナビゲーション">
      <a href="#features">できること</a>
      <a href="#usage">使い方</a>
      <a href="#faq">よくある質問</a>
    </nav>
    <a href="mailto:{メールアドレス}?subject={件名}" class="btn btn--primary btn--sm header__cta">リリース情報を受け取る</a>
  </div>
</header>
```

- ロゴ（アプリ名）は自ページのLP（`/apps/{slug}/`）へリンク
- ナビゲーションはLP内のセクションへのアンカーリンク
- CTAボタンでお問い合わせやリリース情報受け取りへの導線を確保

## フッターの共通リンク

各ページのフッターに以下を設置：

```html
<footer class="footer">
  <div class="container footer__inner">
    <nav class="footer__nav" aria-label="フッターナビゲーション">
      <a href="/apps/{slug}/">{アプリ名}</a>
      <a href="/apps/{slug}/privacy.html">プライバシーポリシー</a>
      <a href="/apps/{slug}/terms.html">利用規約</a>
      <a href="/apps/{slug}/contact.html">お問い合わせ</a>
    </nav>
    <p class="footer__copy">&copy; <span data-year></span> {アプリ名}</p>
  </div>
</footer>
```

- アプリ名リンク：自LPへ戻る
- プライバシーポリシー・利用規約・お問い合わせ：同一アプリ配下へのリンク

## metaタグのテンプレート

各ページの `<head>` に以下を記載。`{slug}` と `{app名}` を実際の値に置き換えること。

```html
<title>{ページタイトル} | {アプリ名}</title>
<meta name="description" content="{ページの説明文（120文字程度）}">
<meta property="og:title" content="{og:title}">
<meta property="og:description" content="{og:description}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://{ドメイン}/apps/{slug}/">
<meta property="og:image" content="https://{ドメイン}/assets/ogp-{slug}.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://{ドメイン}/apps/{slug}/">
<link rel="icon" href="/assets/favicon.png">
<link rel="stylesheet" href="/assets/styles.css">
```

## カスタマイズすべき箇所一覧

新アプリを作成する際、以下の箇所を必ず変更する：

1. **アプリ名**
   - title, og:title, ロゴテキスト, フッターコピー, 見出し内のテキスト

2. **スラッグ**
   - ディレクトリ名, リンクの href, og:url, canonical, og:image

3. **メールアドレス**
   - mailto: リンク全般
   - privacy.html / terms.html / contact.html のお問い合わせ先

4. **metaタグ**
   - description
   - og:title, og:description, og:url, og:image
   - canonical

5. **制定日**
   - privacy.html, terms.html の「初版制定日」

6. **外部サービス**
   - privacy.html の「外部サービス」セクション
   - 利用するサービスが確定したら追記する

7. **OGP画像**
   - `assets/ogp-{slug}.png` を用意する（1200×630）

8. **カードリンク（ルートページ）**
   - `index.html` の `.card-grid` に新アプリのカードを追加
   - カテゴリ、ステータス（準備中/構想中）を設定
