# AI Work Recipes

> **AIに詳しくならなくても、AIで仕事は楽にできる。**

AI Work Recipes は、AIの専門知識や最新モデルを前提にせず、日々の仕事を終わらせるための実践的な手順を「レシピ」として共有するプロジェクトです。

> **レシピを使いたい方へ**：レシピはWebサイト（準備中）で、コピーしてすぐ使える形で公開します。このリポジトリは、レシピの設計・評価・改善に参加したい方のためのものです。

単なるプロンプト集ではありません。各Recipeに、利用手順、所要時間、最低動作モデル、プロンプト、設計理由、限界、評価・テスト結果を含めます。

利用者に求める操作は「貼る」「選ぶ」「答える」だけです。一発で完璧な回答にはこだわらず、AIからの確認質問に答えながら仕上げます。処理を小さく分ける工夫は、プロンプトの内側で行います。

## 対象

制約のある組織で働く実務者を対象に、会議・文章作成・要約・企画・情報整理など、多くの職場に共通する業務を扱います。

- 組織や環境の制約で、最新ではないモデルを使っている人
- AIをこれから使い始める人
- AIそのものを深く学ぶ時間はないが、仕事を少し楽にしたい実務者

各Recipeには、ソフトウェアの最低動作環境と同じ考え方で「最低動作モデル」を明記します。

## 最初のRecipe

[文字起こしから議事録を作る](recipes/meeting/minutes-from-transcript/)（Draft）

```text
文字起こし → 議事録
難易度：★☆☆　作業時間：約3〜5分（目標）　最低動作モデル：GPT-4.1で検証予定
操作：① 貼る　② 必要なら質問に答える　③ 仕上げる
```

利用者の操作は簡単に保ち、プロンプトの内側では抽出 → 判定 → 整理 → 確認 → 編集 → セルフチェックの順に処理させています。**AI側では厳密に、人間側では簡単に**が設計の中心です。

## 構成

```text
README.md
docs/
  concept.md             # プロジェクトの目的と対象
  design-principles.md   # Recipeを設計・レビューする原則
  prompt-patterns.md     # プロンプト設計パターン（P1〜P10）
  distribution.md        # Webサイト・GitHub・noteでの公開方針
  feedback-form.md       # ご意見フォームの設計
  site-design.md         # Webサイトの見せ方の基準
  mock/site-mock.html    # Webサイトのモック
  evaluation.md          # 評価項目とテスト方針
  recipe-spec.md         # Recipe共通仕様
  roadmap.md             # 段階的な実装・公開計画
guides/                          # サイト共通ページの素材（利用者向け）
recipes/
  README.md                      # Recipeの構成と作り方
  categories.yml                 # 業務カテゴリの一覧
  template/                      # 新しいRecipeのテンプレート（ディレクトリごと複製）
  meeting/                       # 業務カテゴリ
    minutes-from-transcript/     # 最初のRecipe（議事録）
      page.md                    # サイト表示の素材（利用者向け）
      prompts/                   # コピー用プロンプト（利用者向け）
      README.md                  # 設計と検証（技術者・改善したい人向け）
      evals/                     # テストセットと評価結果
  reading/
    guideline-to-actions/        # ガイドラインから、やるべきことを整理する
    terms-to-checkpoints/        # 利用規約・約款から、確認すべき条項を整理する
  writing/
    notice-from-memo/            # メモからお知らせ文を作る
  organize/
    classify-comments/           # アンケートや問い合わせを分類して一覧にする
site/                            # Webサイト（Astro）。recipes/ と guides/ から生成する
```

## サイトを手元で確認する

Webサイトは `site/` にあります（Astro）。`package.json` は `site/` の中にあるため、`site/` に移動してから実行します。Node.js 22.19.0 以上が必要です。

```sh
cd site
npm install      # 初回と、パッケージが変わったときだけ
npm run dev      # http://localhost:4321 で確認
```

`recipes/` や `guides/` を編集して保存すると、ブラウザが自動で再読み込みされます。詳しくは [site/README.md](site/README.md) を参照してください。

## 公開方針

レシピを使う人はWebサイト（`tariki-code.tokyo` のサブドメイン）を、技術者や改善に参加したい人はこのGitHubリポジトリを見る、という二層構造にします。サイトはこのリポジトリから生成するため、Recipeの正本はこのリポジトリです。詳しくは [docs/distribution.md](docs/distribution.md) を参照してください。

## 地域コミュニティとの循環

地域の困りごとを起点に、解決方法を設計し、Recipe化して実際に検証し、改善したものを公開します。コミュニティで使われた結果を次の版へ反映し、個別のノウハウを誰でも再利用できる形に育てます。

```text
困りごと → 解決方法の設計 → Recipe化 → 実地検証 → 改善・公開
```

## 状態

現在は初期設計段階です。Recipeの完成度は、`Draft`、`Tested`、`Community-tested`、`Stable` の状態で管理します。

詳しい方針は [docs/](docs/) を、Recipeの作成方法は [recipes/template/](recipes/template/) を参照してください。
