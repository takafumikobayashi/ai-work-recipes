// リポジトリの素材（recipes/ と guides/）を読み込み、サイト用のデータとHTMLに変換する。
// 素材の形式は docs/recipe-spec.md と guides/README.md に従う。形式に合わない素材はビルドを止める。
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { Marked, Renderer, type Token, type Tokens } from 'marked';

// `astro build` / `astro dev` は site/ で実行する前提
const ROOT = path.resolve(process.cwd(), '..');
const RECIPES_DIR = path.join(ROOT, 'recipes');
const GUIDES_DIR = path.join(ROOT, 'guides');

export interface Category {
  id: string;
  label: string;
}

export interface Prompt {
  file: string; // step1-extract.txt
  name: string; // step1-extract
  step: number; // 1
  text: string;
  chars: number;
}

export interface Recipe {
  id: string;
  category: string;
  dir: string; // recipes/meeting/minutes-from-transcript
  url: string;
  data: Record<string, any>;
  body: string;
  prompts: Prompt[];
}

export interface Guide {
  id: string;
  url: string;
  data: Record<string, any>;
  body: string;
}

const REQUIRED = [
  'id', 'title', 'summary', 'category', 'status', 'version', 'difficulty', 'user_steps',
  'user_actions', 'ai_knowledge', 'estimated_time', 'materials', 'minimum_model', 'minimum_model_status',
];

function fail(file: string, msg: string): never {
  throw new Error(`[content] ${path.relative(ROOT, file)}: ${msg}`);
}

function readFrontmatter(file: string): { data: Record<string, any>; body: string } {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) fail(file, 'フロントマターがありません');
  return { data: (load(m[1]) as Record<string, any>) ?? {}, body: m[2] };
}

export function countChars(text: string): number {
  return [...text].length;
}

let categoriesCache: Category[] | undefined;
export function getCategories(): Category[] {
  if (!categoriesCache) {
    categoriesCache = load(fs.readFileSync(path.join(RECIPES_DIR, 'categories.yml'), 'utf8')) as Category[];
  }
  return categoriesCache;
}

let recipesCache: Recipe[] | undefined;
export function getRecipes(): Recipe[] {
  if (recipesCache) return recipesCache;
  const cats = getCategories();
  const list: Recipe[] = [];
  for (const cat of cats) {
    const catDir = path.join(RECIPES_DIR, cat.id);
    if (!fs.existsSync(catDir)) continue;
    for (const name of fs.readdirSync(catDir).sort()) {
      const file = path.join(catDir, name, 'page.md');
      if (!fs.existsSync(file)) continue;
      const { data, body } = readFrontmatter(file);
      for (const key of REQUIRED) if (data[key] === undefined) fail(file, `${key} がありません`);
      if (data.id !== name) fail(file, `id（${data.id}）とフォルダ名（${name}）が一致しません`);
      if (data.category !== cat.id) fail(file, `category（${data.category}）とフォルダ（${cat.id}）が一致しません`);
      const promptDir = path.join(catDir, name, 'prompts');
      const prompts: Prompt[] = fs.existsSync(promptDir)
        ? fs.readdirSync(promptDir).filter((f) => f.endsWith('.txt')).sort().map((f) => {
            const text = fs.readFileSync(path.join(promptDir, f), 'utf8').replace(/\s+$/, '');
            const step = Number(f.match(/^step(\d+)/)?.[1] ?? 0);
            return { file: f, name: f.replace(/\.txt$/, ''), step, text, chars: countChars(text) };
          })
        : [];
      list.push({
        id: name,
        category: cat.id,
        dir: `recipes/${cat.id}/${name}`,
        url: `/recipes/${cat.id}/${name}/`,
        data,
        body,
        prompts,
      });
    }
  }
  recipesCache = list;
  return list;
}

let guidesCache: Guide[] | undefined;
export function getGuides(): Guide[] {
  if (guidesCache) return guidesCache;
  guidesCache = fs.readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => {
      const file = path.join(GUIDES_DIR, f);
      const { data, body } = readFrontmatter(file);
      for (const key of ['id', 'title', 'nav_group']) if (data[key] === undefined) fail(file, `${key} がありません`);
      return { id: data.id, url: `/guides/${data.id}/`, data, body };
    })
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));
  return guidesCache;
}

export function categoryLabel(id: string): string {
  return getCategories().find((c) => c.id === id)?.label ?? id;
}

// ---- Markdown → HTML ----

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function headingId(text: string): string {
  return text.trim().replace(/\s+/g, '-');
}

const COPY_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>';

let panelSeq = 0;

/** コピーボタン付きのプロンプト表示。collapsible は長いプロンプト用（折りたたんで表示） */
export function panelHtml(opts: { label: string; text: string; id?: string; chars?: boolean; collapsible?: boolean }): string {
  const id = opts.id ?? `copy-${++panelSeq}`;
  const chars = opts.chars ? `<span class="chars">${countChars(opts.text).toLocaleString('ja-JP')}字</span>` : '';
  const expand = opts.collapsible
    ? `<button class="expand" type="button" aria-expanded="false">全文を表示 ▾</button>`
    : '';
  return `<div class="panel${opts.collapsible ? '' : ' open'}">
<div class="panel-head"><span class="file"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>${escapeHtml(opts.label)}${chars}</span><button class="copy" type="button" data-copy="${id}">${COPY_ICON}<span>コピー</span></button></div>
<pre id="${id}">${escapeHtml(opts.text)}</pre>${expand}
</div>
<p class="copy-msg" data-msg="${id}" aria-live="polite"></p>`;
}

let checklistSeq = 0;
const defaultRenderer = new Renderer();

const marked = new Marked({
  gfm: true,
  renderer: {
    heading({ tokens, depth, text }) {
      return `<h${depth} id="${escapeHtml(headingId(text))}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
    },
    code({ text }) {
      return panelHtml({ label: '定型文', text });
    },
    table(token) {
      return `<div class="tbl">${defaultRenderer.table.call(this, token)}</div>`;
    },
    list(token) {
      if (!token.items.length || !token.items.every((i) => i.task)) return false;
      const id = `check-${++checklistSeq}`;
      const items = token.items
        .map((item) => {
          const inline = item.tokens.filter((t) => t.type !== 'checkbox').flatMap((t: any) => t.tokens ?? [t]);
          return `<li><label><input type="checkbox"><span>${this.parser.parseInline(inline)}</span></label></li>`;
        })
        .join('');
      return `<div class="check-block" id="${id}"><ul class="checklist">${items}</ul>
<div class="meter" aria-hidden="true"><i></i></div><p class="progress" aria-live="polite">0 / ${token.items.length} 確認済み</p></div>\n`;
    },
  },
});

function withLinks(tokens: Token[]): Token[] & { links: Record<string, never> } {
  return Object.assign([...tokens], { links: {} });
}

export function renderTokens(tokens: Token[]): string {
  return marked.parser(withLinks(tokens));
}

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

export function lex(md: string): Token[] {
  return marked.lexer(md);
}

/** 見出し（指定した深さ）でトークンを区切る。見出しより前のトークンは title='' に入る */
export function splitByHeading(tokens: Token[], depth: number): { title: string; tokens: Token[] }[] {
  const out: { title: string; tokens: Token[] }[] = [{ title: '', tokens: [] }];
  for (const t of tokens) {
    if (t.type === 'heading' && (t as Tokens.Heading).depth === depth) out.push({ title: (t as Tokens.Heading).text.trim(), tokens: [] });
    else out[out.length - 1].tokens.push(t);
  }
  return out.filter((s) => s.title || s.tokens.some((t) => t.type !== 'space'));
}

/** 段落がプロンプトファイルへのリンクだけでできていれば、そのファイル名を返す */
export function promptLink(t: Token): string | undefined {
  if (t.type !== 'paragraph') return undefined;
  const inner = (t as Tokens.Paragraph).tokens.filter((x) => !(x.type === 'text' && !x.raw.trim()));
  if (inner.length !== 1 || inner[0].type !== 'link') return undefined;
  const m = (inner[0] as Tokens.Link).href.match(/^prompts\/(.+\.txt)$/);
  return m?.[1];
}
