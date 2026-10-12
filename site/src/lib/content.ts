// リポジトリの素材（recipes/ と guides/）を読み込み、サイト用のデータとHTMLに変換する。
// 素材の形式は docs/recipe-spec.md と guides/README.md に従う。形式に合わない素材はビルドを止める。
import fs from 'node:fs';
import path from 'node:path';
import { load as loadYaml, CORE_SCHEMA } from 'js-yaml';
import { Marked, Renderer, type Token, type Tokens } from 'marked';

// `astro build` / `astro dev` は site/ で実行する前提
const ROOT = path.resolve(process.cwd(), '..');
const RECIPES_DIR = path.join(ROOT, 'recipes');
const GUIDES_DIR = path.join(ROOT, 'guides');

// 素材は fs で直接読むため、Vite の変更検知の対象にならない。
// ビルドでは1回だけ読めばよいのでキャッシュし、開発サーバー（npm run dev）では毎回読み直して編集をすぐ反映する
const USE_CACHE = !import.meta.env.DEV;

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

// docs/recipe-spec.md の「必須メタデータ」。サイトに表示する値は、形式もここで確かめる
const REQUIRED = [
  'id', 'title', 'summary', 'category', 'status', 'version', 'audience', 'difficulty', 'user_steps',
  'user_actions', 'ai_knowledge', 'estimated_time', 'materials', 'minimum_model', 'minimum_model_status',
  'tested_models', 'last_tested', 'input_types', 'output_types', 'confidentiality',
];
const LIST_FIELDS = ['audience', 'user_actions', 'materials', 'tested_models', 'input_types', 'output_types'];
// docs/recipe-spec.md の「Recipeの状態」
const STATUSES = ['Draft', 'Tested', 'Community-tested', 'Stable'];
const MODEL_STATUSES = ['未検証', '検証中', '確認済み'];

/** YYYY-MM-DD の形式で、かつ実在する日付か（2026-02-30 などを除く） */
export function isRealDate(s: string): boolean {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const [y, mo, d] = m.slice(1).map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

function validateRecipe(file: string, data: Record<string, any>) {
  for (const key of REQUIRED) {
    if (data[key] === undefined || data[key] === null || data[key] === '') fail(file, `${key} がありません`);
  }
  for (const key of LIST_FIELDS) if (!Array.isArray(data[key])) fail(file, `${key} はリスト（[...]）で書いてください`);
  if (typeof data.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(data.version)) {
    fail(file, `version（${data.version}）は 0.1.0 の形式で書いてください`);
  }
  if (!STATUSES.includes(data.status)) fail(file, `status（${data.status}）は ${STATUSES.join(' / ')} のいずれかにしてください`);
  if (![1, 2, 3].includes(data.difficulty)) fail(file, `difficulty（${data.difficulty}）は 1〜3 で書いてください`);
  if (!Number.isInteger(data.user_steps) || data.user_steps < 1) fail(file, `user_steps（${data.user_steps}）は 1 以上の整数で書いてください`);
  if (!MODEL_STATUSES.includes(data.minimum_model_status)) {
    fail(file, `minimum_model_status（${data.minimum_model_status}）は ${MODEL_STATUSES.join(' / ')} のいずれかにしてください`);
  }
  // 確認済みと表示するには、確認日と確認したモデルが要る（サイトに「確認済み（日付）」と出すため）
  if (data.minimum_model_status === '確認済み') {
    if (!isRealDate(String(data.last_tested))) {
      fail(file, `確認済みの場合、last_tested（${data.last_tested}）は実在する日付を YYYY-MM-DD の形式で書いてください`);
    }
    if (!data.tested_models.includes(data.minimum_model)) {
      fail(file, `確認済みの場合、tested_models に minimum_model（${data.minimum_model}）を含めてください`);
    }
  }
}

// YAMLは CORE_SCHEMA で読む。日付（2026-10-12）を Date に変換させず、書かれた文字列のまま検証するため。
// Date に変換されると 2026-02-30 が 3月2日 に繰り上がり、実在しない日付のチェックをすり抜ける
function load(src: string): unknown {
  return loadYaml(src, { schema: CORE_SCHEMA });
}

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

// recipes/ の直下で、カテゴリではないディレクトリ
const RESERVED_DIRS = ['template'];

function subdirs(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();
}

let categoriesCache: Category[] | undefined;
export function getCategories(): Category[] {
  if (USE_CACHE && categoriesCache) return categoriesCache;
  const file = path.join(RECIPES_DIR, 'categories.yml');
  const cats = load(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(cats)) fail(file, 'カテゴリのリストになっていません');
  const seen = new Set<string>();
  for (const c of cats) {
    if (!c?.id || !c?.label) fail(file, `id と label が必要です（${JSON.stringify(c)}）`);
    if (seen.has(c.id)) fail(file, `id（${c.id}）が重複しています`);
    seen.add(c.id);
  }
  // categories.yml への登録を忘れたカテゴリは、レシピがサイトから黙って消えるため、ビルドを止める
  for (const dir of subdirs(RECIPES_DIR)) {
    if (!RESERVED_DIRS.includes(dir) && !seen.has(dir)) {
      fail(path.join(RECIPES_DIR, dir), `カテゴリ（${dir}）が recipes/categories.yml に登録されていません`);
    }
  }
  categoriesCache = cats as Category[];
  return categoriesCache;
}

let recipesCache: Recipe[] | undefined;
export function getRecipes(): Recipe[] {
  if (USE_CACHE && recipesCache) return recipesCache;
  const cats = getCategories();
  const list: Recipe[] = [];
  for (const cat of cats) {
    const catDir = path.join(RECIPES_DIR, cat.id);
    if (!fs.existsSync(catDir)) continue;
    for (const name of subdirs(catDir)) {
      const file = path.join(catDir, name, 'page.md');
      if (!fs.existsSync(file)) fail(path.join(catDir, name), 'page.md がありません');
      const { data, body } = readFrontmatter(file);
      validateRecipe(file, data);
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

// guides/README.md のフロントマターの決まり
const NAV_GROUPS = ['top', 'help', 'about'];

function validateGuide(file: string, name: string, data: Record<string, any>) {
  for (const key of ['id', 'title', 'nav_group', 'order']) {
    if (data[key] === undefined || data[key] === null || data[key] === '') fail(file, `${key} がありません`);
  }
  // URL（/guides/<id>/）が重ならないよう、ファイル名と一致させる
  if (data.id !== name) fail(file, `id（${data.id}）とファイル名（${name}）が一致しません`);
  if (!NAV_GROUPS.includes(data.nav_group)) {
    fail(file, `nav_group（${data.nav_group}）は ${NAV_GROUPS.join(' / ')} のいずれかにしてください`);
  }
  if (!Number.isInteger(data.order)) fail(file, `order（${data.order}）は整数で書いてください`);
}

let guidesCache: Guide[] | undefined;
export function getGuides(): Guide[] {
  if (USE_CACHE && guidesCache) return guidesCache;
  guidesCache = fs.readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => {
      const file = path.join(GUIDES_DIR, f);
      const { data, body } = readFrontmatter(file);
      validateGuide(file, f.replace(/\.md$/, ''), data);
      return { id: data.id, url: `/guides/${data.id}/`, data, body };
    })
    .sort((a, b) => a.data.order - b.data.order);
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
