# site

利用者向けWebサイト「AI業務レシピ β」の実装。[Astro](https://astro.build/) で静的なHTMLを生成し、Cloudflare Pages で配信する。

サイト側でRecipeの内容は持たない。リポジトリの次の素材から、ビルドのたびに生成する（[../docs/distribution.md](../docs/distribution.md)）。

| 素材 | 生成するもの |
|---|---|
| `recipes/categories.yml` | メニューの「業務から探す」の並び順と表示名 |
| `recipes/<category>/<id>/page.md` のフロントマター | 一覧のカード、Recipeページ冒頭のカード |
| `recipes/<category>/<id>/page.md` の本文 | Recipeページ `/recipes/<category>/<id>/`（使い方、長すぎて送れないとき、使う前に、最後に確認すること、なぜうまくいくの？） |
| `recipes/<category>/<id>/prompts/*.txt` | コピー用のプロンプトと文字数、メニューのコピーボタン |
| `guides/*.md` | サイト共通ページ（`/guides/<id>/`） |

`recipes/template/` と `README.md` はサイトに出さない。Recipeの `README.md` へは、ページ下部の「設計・評価・改訂履歴を見る（GitHub）」からリンクする。

## 開発

Node.js 22.19.0 以上が必要（依存パッケージの `undici` の要件。`package.json` の `engines` にも記載）。`.node-version` は `22` として、Cloudflare Pages では22系の最新版を使う。

```sh
cd site
npm install
npm run dev       # http://localhost:4321 で確認
npm run build     # dist/ に出力
npm run preview   # 出力したサイトを確認
```

`npm run dev` の間は、`recipes/` と `guides/` の素材（`page.md`、`prompts/*.txt`、`categories.yml` など）を保存すると、ブラウザが自動で再読み込みされ、変更と形式のチェックがすぐ反映される。素材は開発時には毎回読み直し、`npm run build` のときだけ1回読んで使い回す（`src/lib/content.ts` の `USE_CACHE`）。

ビルドは素材の形式もチェックし、次の場合は失敗する（`src/lib/content.ts` の `getCategories`・`getRecipes`・`validateRecipe`・`validateGuide`、`src/lib/recipe-view.ts` の `recipeSections`）。

- `recipes/` の直下に、`categories.yml` に登録されていないフォルダがある（`template/` を除く）。`categories.yml` の `id` が重複している
- カテゴリのフォルダの中に、`page.md` のないフォルダがある
- `page.md` に、[recipe-spec.md](../docs/recipe-spec.md) の必須メタデータが欠けている。リストの項目が `[...]` になっていない
- `id` とフォルダ名、`category` とカテゴリのフォルダが一致しない。レシピのフォルダ名、カテゴリのID、ガイドのファイル名が英小文字・数字・ハイフンの形でない（URLになるため）
- `version` が `0.1.0` の形式でない。`status` が `Draft / Tested / Community-tested / Stable` 以外。`difficulty` が 1〜3 でない。`minimum_model_status` が「未検証 / 検証中 / 確認済み」のいずれでもない
- `minimum_model_status` が `確認済み` なのに、`last_tested` が `YYYY-MM-DD` 形式の実在する日付でない（`2026-02-30` などは不可）、または `tested_models` に `minimum_model` が含まれていない
- `page.md` の本文に、必須の見出し（使い方、長すぎて送れないとき、使う前に、最後に確認すること、なぜうまくいくの？）がない、中身が空、または2回ある
- 「使い方」にSTEP（`### ①` など）やプロンプトへのリンクがない。STEPの数が `user_steps` や `user_actions` の数と一致しない。「最後に確認すること」に `- [ ]` のチェックリストがない
- `page.md` から参照したプロンプトのファイルがない。`prompts/` のファイル名が `step<番号>-<名前>.txt` の形でない、中身が空、置いたSTEPの番号とファイル名の番号が違う、`page.md` から参照されていない
- `guides/*.md` に `id`・`title`・`nav_group`・`order` が欠けている。`id` がファイル名と違う。`nav_group` が `top / help / about` 以外。`order` が整数でない

## 構成

```text
astro.config.mjs
src/
  site.config.ts           # GitHubのURL、ご意見フォームのURL、noindex など
  lib/content.ts           # 素材の読み込みとMarkdownの変換
  lib/recipe-view.ts       # page.md をRecipeページの部品に分ける
  layouts/Base.astro       # ヘッダ・左メニュー・フォント
  components/              # メニュー、カード、難易度の★
  pages/                   # /、/recipes/<category>/<id>/、/guides/<id>/、404
  styles/site.css          # 色・レイアウト（基準は docs/site-design.md）
  scripts/site.ts          # メニュー開閉、検索、コピー、チェックリスト
public/                    # favicon、OGP画像（og.jpg）、robots.txt
```

### page.md の読み方

- `## 使い方` の下の `### ①` `### ②` … を STEP として縦に並べる。見出しに「必要なら」を含む STEP は、点線の番号で「必要なときだけ」と表示する
- STEP の中で、`[…](prompts/xxx.txt)` だけの段落はプロンプトのパネル（コピーボタン・文字数・全文表示）に置き換える。コードブロックは回答例として表示する
- `## 使う前に` はRecipeページの冒頭（カードの下）に移す
- それ以外の場所のコードブロック（分割送信の定型文など）は、コピーボタン付きで表示する
- `- [ ]` のリストは、チェックリスト（進み具合のバー付き）にする
- 上記以外の `##` 見出しは、そのまま本文として表示する

## Cloudflare Pages の設定

GitHubリポジトリと連携し、次のとおり設定する。

| 項目 | 値 |
|---|---|
| Framework preset | Astro |
| Root directory | `site` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |

- Node.js のバージョンは `site/.node-version` で指定している
- 公開前は、プレビューURL（`*.pages.dev`）を Cloudflare Access で制限する
- 独自ドメインは、Cloudflare Pages の「Custom domains」で `ai-work-recipes.tariki-code.tokyo` を追加し、Netlify DNS に `<project>.pages.dev` 宛ての CNAME レコードを追加する
- 検索エンジンに載せるかは `src/site.config.ts` の `noindex` で切り替える（β公開で `false` にした）
- アクセス解析は、下の「Google Analytics」の手順で `src/site.config.ts` の `gaMeasurementId` を設定する
- ご意見フォームを作ったら、`src/site.config.ts` の `feedbackUrl` と `feedbackRecipeEntry` を設定する（手順は [docs/feedback-form.md](../docs/feedback-form.md)）

## OGP（SNSなどで共有したときの表示）

すべてのページに、OGP（`og:title`・`og:description`・`og:image` など）と `canonical` を出力する（`src/layouts/Base.astro`）。

- タイトルと説明は、ページの `<title>` と `description` と同じ。レシピのページはフロントマターの `title` と `summary` を使い、`og:type` を `article` にする
- URLは `astro.config.mjs` の `site` を基準にした絶対URLにする
- 画像は全ページ共通の `public/og.jpg`（1200×630）。`src/site.config.ts` の `ogImage` と `ogImageAlt` で指定する
- 画像を差し替えるときは、1200×630 に縮小し、300KB程度までに軽くしてから置く（重い画像は、SNSによっては表示されない）。画像の中の文言を変えたら `ogImageAlt` も合わせる

公開後の表示は、各SNSのツールで確認する（X は投稿画面のプレビュー、Facebook は [シェアデバッガー](https://developers.facebook.com/tools/debug/)）。画像を差し替えたときは、SNS側のキャッシュが残るため、シェアデバッガーで再取得する。

## Google Analytics

GA4 を使う。測定IDを `src/site.config.ts` の `gaMeasurementId` に設定すると、`src/layouts/Base.astro` が gtag.js を読み込む。

1. [Google Analytics](https://analytics.google.com/) で、このサイト用のプロパティを作る（タイムゾーンは日本、通貨は日本円）
2. ウェブのデータストリームを作り、URLに `https://ai-work-recipes.tariki-code.tokyo` を入れる
3. 表示された測定ID（`G-XXXXXXXXXX`）を `gaMeasurementId` に設定する

- 読み込むのは、本番ビルド（`npm run build`）を本番のドメイン（`astro.config.mjs` の `site`）で開いたときだけ。開発中、プレビューURL（`*.pages.dev`）、`npm run preview` では計測しない
- gtag.js は非同期で読み込む。組織のネットワークで遮断されていても、サイトの動きには影響しない（計測されないだけ）
- コピーボタンを押してコピーできたときに、イベント `copy_prompt` を送る。パラメータは `recipe_path`（レシピのURLのパス）、`copy_id`（コピーした部品のID）、`from_menu`（メニューのコピーボタンからか）。レシピ別に集計するには、GA4 の「管理 → カスタム定義」で `recipe_path` をイベントスコープのカスタムディメンションとして登録する
- 利用者向けに、Googleアナリティクスを使っていることを `guides/analytics.md`（アクセス解析について）で知らせている。集める情報を変えたら、このページも直す
