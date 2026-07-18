# ストア公開時のLP切り替え手順

公開状態と正式ストアURLは`tool/site_manifest.json`を基準に管理します。

## manifest項目

各アプリは次の項目を持ちます。

```json
{
  "slug": "example-app",
  "display_name": "表示名",
  "release_status": "preparing",
  "google_play_url": null,
  "app_store_url": null
}
```

`release_status`の値:

- `preparing`: 公開準備中。ストアリンクをLPへ表示しない
- `published`: 公開中。Google PlayまたはApp Storeの正式URLが必須
- `suspended`: 公開停止中。ストアリンクを主要導線へ表示しない

## Google Play公開時

1. Play Consoleで正式な公開URLを取得する
2. manifestの`google_play_url`へ登録する
3. `release_status`を`published`へ変更する
4. ルート`index.html`の対象カードを更新する
   - `data-release-status="published"`
   - 表示ラベルを`公開中`
5. アプリLPの主要CTAをmanifestと完全一致するGoogle Play URLへ変更する
6. ヘッダー、Hero、最終CTA、フッターまたは法務ページから必要な導線を追加する
7. 公開前のメール問い合わせCTAが不要なら削除または副導線へ変更する
8. `docs/release-legal-checklist.md`を完了する
9. ローカル検証とPR検証を通す
10. Productionデプロイ後、実際のストアリンク遷移を確認する

Google Play URLは次の形式だけを許可します。

```text
https://play.google.com/store/apps/details?id=<package-id>
```

## App Store公開時

`app_store_url`へ`https://apps.apple.com/.../app/.../id<数字>`形式の正式URLを登録し、Google Playと同じ完了条件でCTAと公開状態を更新します。

## CIで検出する不整合

`tool/validate_site.py`は次を失敗として扱います。

- 未定義の`release_status`
- `published`なのにストアURLがない
- Google PlayまたはApp Store URLのホスト・パス形式が不正
- ポータルカードのslug、状態、表示名、状態ラベルがmanifestと不一致
- `published`の正式ストアURLがアプリLPに存在しない
- `preparing`または`suspended`のアプリLPがストアリンクを表示する

## 公開停止・ロールバック

ストア公開を一時停止した場合:

1. `release_status`を`suspended`へ変更する
2. ポータル表示を`公開停止中`へ変更する
3. アプリLPの主要ストアCTAを削除する
4. 問い合わせまたは状況説明へ差し替える
5. manifestのストアURLは再開用に保持してよいが、LPには露出させない
6. Production検証を通す

## 完了条件

- manifest、ポータル、アプリLP、ストアの公開状態が一致する
- 正式ストアURLがCIで検証される
- 法務ページとストア申告が提出ビルドに一致する
- Productionのページ、資産、ヘッダー、ブラウザ、アクセシビリティ、Lighthouse検証が成功する
