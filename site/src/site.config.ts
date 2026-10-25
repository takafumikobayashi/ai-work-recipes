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
  // Google Analytics 4 の測定ID（例：'G-XXXXXXXXXX'）。空欄のあいだは読み込まない。
  // 読み込むのは本番ビルドを本番のドメイン（astro.config.mjs の site）で開いたときだけ。プレビューURLや開発中は計測しない
  gaMeasurementId: 'G-8G3ZXR4WPY',
  // SNSなどで共有したときに表示する画像（public/ に置く。1200×630）。全ページ共通
  ogImage: '/og.jpg',
  ogImageAlt: 'AI業務レシピ β：AIに詳しくなくても、AIで仕事は楽にできる。実務でそのまま使える、AIの手順集。',
  // true のあいだは検索エンジンに載せない
  noindex: false,
};
