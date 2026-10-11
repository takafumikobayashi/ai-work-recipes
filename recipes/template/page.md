---
id: short-name
title: [Recipe名]
summary: [何を貼ると、何ができるかを一文で。カードと一覧に表示する]
category: [meeting / writing / summary / research / planning / excel / email]
status: Draft
version: 0.1.0
audience: [beginner, constrained-environment]
difficulty: 1
user_steps: 3
user_actions: [貼る, 答える, 仕上げる]
ai_knowledge: 不要
estimated_time: 約○分（目標）
minimum_model: 未確認
tested_models: []
last_tested: 未確認
input_types: [テキスト]
output_types: [テキスト]
confidentiality: [入力可否と注意事項]
---

## 使い方

### ① [入力資料]を貼る

プロンプトをコピーして、`【ここに[入力資料]を貼り付けてください】` の部分を[入力資料]に置き換えて送信します。

[STEP 1のプロンプト](prompts/step1-xxx.txt)

[返ってくるもの。まだ完成版ではないこと。]

### ② 必要なら質問に答える

AIから「確認したいこと」があれば、短く答えます。「重要な確認事項はありません」と返ってきたら、このステップは飛ばしてください。

```text
[回答の例]
```

分からないときは「不明です。そのまま進めてください」で大丈夫です。

### ③ [成果物]に仕上げる

同じ会話の中で、完成版を作るプロンプトをコピーして送信します。

[STEP 3のプロンプト](prompts/step3-xxx.txt)

[返ってくるもの。]

## 使う前に

次の情報は入力しないでください。

- [入力してはいけない情報と、置き換え方]

## 最後に確認すること

[使う前・共有する前]に、次の点だけは確認してください。

- [ ] [重要項目1]
- [ ] [重要項目2]
- [ ] [重要項目3]
