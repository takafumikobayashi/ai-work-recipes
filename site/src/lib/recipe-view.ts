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

export function hasOptionalStep(r: Recipe): boolean {
  return (r.data.user_actions ?? []).some((a: string) => /答える|選ぶ/.test(a));
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
  caution?: string;
  tooLong?: string;
  checklist?: string;
  why?: string;
  others: { title: string; html: string }[];
}

const STEP_HEADING = /^[①-⑳]\s*/;

/** 使い方の各STEPの本文。プロンプトへのリンクはパネルに、STEP内のコードは回答例にする */
function renderStep(r: Recipe, tokens: Token[]): string {
  let afterBlock = false;
  const parts: string[] = [];
  for (const t of tokens) {
    if (t.type === 'space') continue;
    const file = promptLink(t);
    if (file) {
      const p = r.prompts.find((x) => x.file === file);
      if (!p) throw new Error(`[content] ${r.dir}/page.md: prompts/${file} がありません`);
      parts.push(`<div id="${p.name}">${panelHtml({ label: p.name, text: p.text, id: `p-${p.name}`, chars: true, collapsible: true })}</div>`);
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
  const out: RecipeSections = { steps: [], others: [] };
  for (const sec of splitByHeading(lex(r.body), 2)) {
    switch (sec.title) {
      case '使い方':
        out.steps = splitByHeading(sec.tokens, 3)
          .filter((s) => s.title)
          .map((s, i) => {
            const optional = /必要なら/.test(s.title);
            const title = s.title.replace(STEP_HEADING, '').replace(/^必要なら/, '');
            return { num: i + 1, title, optional, html: renderStep(r, s.tokens) };
          });
        break;
      case '使う前に':
        out.caution = renderTokens(sec.tokens);
        break;
      case '長すぎて送れないとき':
        out.tooLong = renderTokens(sec.tokens);
        break;
      case '最後に確認すること':
        out.checklist = renderTokens(sec.tokens).replace(/^<p>/, '<p class="note">');
        break;
      case 'なぜうまくいくの？':
        out.why = renderTokens(sec.tokens);
        break;
      default:
        if (sec.title) out.others.push({ title: sec.title, html: renderTokens(sec.tokens) });
    }
  }
  if (!out.steps.length) throw new Error(`[content] ${r.dir}/page.md: 「## 使い方」のSTEPがありません`);
  return out;
}
