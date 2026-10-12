// page.md のフロントマターと本文を、Recipeページとカードの表示用に組み立てる。
import type { Recipe } from './content';
import { lex, splitByHeading, renderTokens, promptLink, panelHtml, escapeHtml, categoryLabel } from './content';
import type { Token, Tokens } from 'marked';
import { SITE } from '../site.config';

export function eyebrow(r: Recipe): string {
  return `${r.category.toUpperCase()} · ${categoryLabel(r.category)}`;
}

/** 「約3〜5分（目標）」→ 本体と補足に分ける */
export function timeParts(r: Recipe): { main: string; sub?: string } {
  const s = String(r.data.estimated_time);
  const m = s.match(/^(.*?)（(.*)）$/);
  if (!m) return { main: s };
  return { main: m[1], sub: m[2] === '目標' ? '目標・未実測' : m[2] };
}

export function modelStatus(r: Recipe): { label: string; verified: boolean } {
  const status = String(r.data.minimum_model_status);
  return { label: `${r.data.minimum_model} ${status}`, verified: status === '確認済み' };
}

export function githubUrl(r: Recipe): string {
  return `${SITE.github}/tree/${SITE.githubBranch}/${r.dir}`;
}

export interface Step {
  num: number;
  title: string;
  optional: boolean;
  html: string;
}

export interface RecipeSections {
  steps: Step[];
  caution: string;
  tooLong: string;
  checklist: string;
  why: string;
  others: { title: string; html: string }[];
}

// docs/recipe-spec.md の「page.md の本文」で必須としている見出し。
// 欠けると、入力してはいけない情報や人間による最終確認が、公開ページから黙って消えるため、ビルドを止める
const REQUIRED_SECTIONS = ['使い方', '長すぎて送れないとき', '使う前に', '最後に確認すること', 'なぜうまくいくの？'];

const STEP_HEADING = /^[①-⑳]\s*/;

/** 使い方の各STEPの本文。プロンプトへのリンクはパネルに、STEP内のコードは回答例にする */
function renderStep(r: Recipe, num: number, tokens: Token[]): string {
  let afterBlock = false;
  const parts: string[] = [];
  for (const t of tokens) {
    if (t.type === 'space') continue;
    const file = promptLink(t);
    if (file) {
      const p = r.prompts.find((x) => x.file === file);
      if (!p) throw new Error(`[content] ${r.dir}/page.md: prompts/${file} がありません`);
      // メニューの「STEP N をコピー」はファイル名の番号から作るため、置いたSTEPの番号と一致させる
      if (p.step !== num) throw new Error(`[content] ${r.dir}/page.md: prompts/${file} がSTEP ${num} に置かれています。ファイル名の番号（step${p.step}）と一致させてください`);
      parts.push(`<div class="prompt-anchor" id="${p.name}">${panelHtml({ label: p.name, text: p.text, id: `p-${p.name}`, chars: true, collapsible: true })}</div>`);
      afterBlock = true;
    } else if (t.type === 'code') {
      parts.push(`<div class="answer">${escapeHtml((t as Tokens.Code).text)}</div>`);
      afterBlock = true;
    } else if (afterBlock && t.type === 'paragraph') {
      parts.push(renderTokens([t]).replace(/^<p>/, '<p class="note">'));
    } else {
      parts.push(renderTokens([t]));
    }
  }
  return parts.join('\n');
}

export function recipeSections(r: Recipe): RecipeSections {
  const fail = (msg: string): never => {
    throw new Error(`[content] ${r.dir}/page.md: ${msg}`);
  };
  const sections = splitByHeading(lex(r.body), 2).filter((s) => s.title);
  for (const name of REQUIRED_SECTIONS) {
    const found = sections.filter((s) => s.title === name);
    if (found.length === 0) fail(`「## ${name}」がありません`);
    if (found.length > 1) fail(`「## ${name}」が${found.length}回あります`);
    if (!found[0].tokens.some((t) => t.type !== 'space')) fail(`「## ${name}」の中身がありません`);
  }
  const get = (name: string) => sections.find((s) => s.title === name)!.tokens;

  const steps = splitByHeading(get('使い方'), 3)
    .filter((s) => s.title)
    .map((s, i) => {
      const optional = /必要なら/.test(s.title);
      const title = s.title.replace(STEP_HEADING, '').replace(/^必要なら/, '');
      return { num: i + 1, title, optional, html: renderStep(r, i + 1, s.tokens), hasPrompt: s.tokens.some((t) => promptLink(t)) };
    });
  if (!steps.length) fail('「## 使い方」に「### ①」などのSTEPがありません');
  // カードの「操作 Nステップ」はフロントマターから、使い方の手順は本文から作るため、数がずれると表示が食い違う
  if (steps.length !== r.data.user_steps) {
    fail(`user_steps（${r.data.user_steps}）と「## 使い方」のSTEPの数（${steps.length}）が一致しません`);
  }
  if (r.data.user_actions.length !== steps.length) {
    fail(`user_actions（${r.data.user_actions.length}個）と「## 使い方」のSTEPの数（${steps.length}）が一致しません`);
  }
  if (!steps.some((s) => s.hasPrompt)) fail('「## 使い方」に、プロンプト（prompts/*.txt）へのリンクがありません');
  // prompts/ のファイルはすべてメニューにコピーボタンとして出るため、使い方で参照していないものは置かない
  const linked = new Set(get('使い方').map(promptLink).filter(Boolean));
  for (const p of r.prompts) {
    if (!linked.has(p.file)) fail(`prompts/${p.file} が「## 使い方」から参照されていません。使わないファイルは削除してください`);
  }

  const checks = get('最後に確認すること');
  const hasChecklist = checks.some((t) => t.type === 'list' && (t as Tokens.List).items.length > 0 && (t as Tokens.List).items.every((i) => i.task));
  if (!hasChecklist) fail('「## 最後に確認すること」に、「- [ ] 」で始まるチェックリストがありません');

  return {
    steps: steps.map(({ hasPrompt, ...s }) => s),
    caution: renderTokens(get('使う前に')),
    tooLong: renderTokens(get('長すぎて送れないとき')),
    checklist: renderTokens(checks).replace(/^<p>/, '<p class="note">'),
    why: renderTokens(get('なぜうまくいくの？')),
    others: sections
      .filter((s) => !REQUIRED_SECTIONS.includes(s.title))
      .map((s) => ({ title: s.title, html: renderTokens(s.tokens) })),
  };
}
