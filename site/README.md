# site

利用者向けWebサイト「AI業務レシピ β」の実装。[Astro](https://astro.build/) で静的なHTMLを生成し、Cloudflare Pages で配信する。

サイト側でRecipeの内容は持たない。リポジトリの次の素材から、ビルドのたびに生成する（[../docs/distribution.md](../docs/distribution.md)）。

| 素材 | 生成するもの |
|---|---|
| `recipes/categories.yml` | メニューの「業務から探す」の並び順と表示名 |
| `recipes/<category>/<id>/page.md` のフロントマター | 一覧のカード、Recipeページ冒頭のカード |
| `recipes/<category>/<id>/page.md` の本文 | Recipeページ（使い方、長すぎて送れないとき、使う前に、最後に確認すること、なぜうまくいくの？） |
| `recipes/<category>/<id>/prompts/*.txt` | コピー用のプロンプトと文字数、メニューのコピーボタン |
| `guides/*.md` | サイト共通ページ（`/guides/<id>/`） |

`recipes/template/` と `README.md` はサイトに出さない。Recipeの `README.md` へは、ページ下部の「設計・評価・改訂履歴を見る（GitHub）」からリンクする。

## 開発

Node.js 22 以上が必要。

```sh
cd site
npm install
npm run dev       # http://localhost:4321 で確認
npm run build     # dist/ に出力
npm run preview   # 出力したサイトを確認
```

`npm run dev` は `site/` の外の素材の変更を自動では反映しない。`page.md` やプロンプトを直したときは、ページを再読み込みするか、開発サーバーを起動し直す。

ビルドは素材の形式もチェックする。`page.md` の必須項目が欠けている、`id` とフォルダ名が違う、`page.md` から参照したプロンプトのファイルがない、といった場合はビルドが失敗する。

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
public/                    # favicon
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
- β公開のときに `src/site.config.ts` の `noindex` を `false` にし、`feedbackUrl` を設定する
