// サイト全体の設定。公開時に見直す項目をここに集める。
export const SITE = {
  name: 'AI業務レシピ',
  description: 'AIに詳しくなくても、プロンプトをコピーして資料を貼るだけで、普段の仕事を短時間で終わらせるための手順集です。',
  github: 'https://github.com/takafumikobayashi/ai-work-recipes',
  githubBranch: 'main',
  // ご意見フォームのURL（Googleフォームの回答用URL）。未設定のあいだはメニューに「準備中」と表示し、レシピのページにはリンクを出さない
  feedbackUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSflatZMDGHtfRxl8vdoHNcSl97Bu95s4v97Cj5EvM95bvo4NQ/viewform',
  // フォームの「レシピ名」の質問の項目ID（例：'entry.1234567890'）。
  // 設定すると、レシピのページから開いたときに、そのレシピ名が入った状態でフォームが開く。作り方は docs/feedback-form.md
  feedbackRecipeEntry: 'entry.624644269',
  // β公開まで検索エンジンに載せない
  noindex: true,
};
