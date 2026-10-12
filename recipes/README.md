# Recipes

このディレクトリには、Recipeの正本を置きます。Recipeを**使う人はWebサイト**を見ます。このディレクトリは、Recipeを作る・検証する・改善する人のためのものです。

## 構成

```text
recipes/
  <category>/              # 業務カテゴリ（meeting, reading など。categories.yml の id）
    <name>/                # Recipe。フォルダの場所がサイトのURL（/recipes/<category>/<name>/）になる
      page.md              # サイト表示の素材：カード情報（フロントマター）、使い方、注意、最後の確認
      prompts/             # コピー用プロンプト（本文のみ）
      README.md            # 設計と検証：なぜこの形か、限界、評価、改訂履歴
      evals/               # テストセットと評価記録
  template/                # 新しいRecipeのテンプレート
```

詳しい仕様は [docs/recipe-spec.md](../docs/recipe-spec.md) を参照してください。

## Recipe一覧

| カテゴリ | Recipe | 状態 |
|---|---|---|
| meeting | [文字起こしから議事録を作る](meeting/minutes-from-transcript/) | Draft |
| reading | [ガイドラインから、やるべきことを整理する](reading/guideline-to-actions/) | Draft |

## 状態

- `Draft`：設計案
- `Tested`：テスト結果を記録済み
- `Community-tested`：実際の利用者・現場で検証済み
- `Stable`：既知の制約が整理され、定期見直し中

状態は品質保証の代わりではありません。特に外部公開、重要な判断、機密情報の扱いでは、利用者と組織の確認を優先してください。

## 新しいRecipeを作る

1. [template/](template/) を `recipes/<category>/<name>/` にディレクトリごと複製する
2. `README.md` で、仕事の分解・判断基準・中間フォーマットを先に設計する
3. [docs/prompt-patterns.md](../docs/prompt-patterns.md) のパターンに沿ってプロンプトを書き、`prompts/` に置く
4. `page.md` に、利用者向けの使い方を短く書く（です・ます調）
5. 小さなテストセットで確認し、結果・制約・改訂履歴を `README.md` に記録する
6. レビュー後に状態を更新する

改善の提案や、うまくいかなかった事例の報告は、IssueやPull Requestで受け付けます。
