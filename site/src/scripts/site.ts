// サイトの動き：メニューの開閉、カテゴリの開閉、検索、コピー、全文表示、チェックリスト。
// 利用者の環境で外部に通信しないよう、すべてこのファイルの中で完結させる。

const root = document.documentElement;
const mq = window.matchMedia('(max-width: 899px)');
const toggle = document.getElementById('nav-toggle')!;

function store(k: string, v: string) {
  try { localStorage.setItem(k, v); } catch { /* 保存できない環境では毎回開いた状態にする */ }
}
function load(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}

/* メニュー：PCは折りたたみ（状態を保存）、スマートフォンは引き出し */
function setNav(open: boolean) {
  if (mq.matches) {
    root.classList.toggle('nav-open', open);
    root.classList.remove('nav-closed');
  } else {
    root.classList.toggle('nav-closed', !open);
    root.classList.remove('nav-open');
  }
  toggle.setAttribute('aria-expanded', String(open));
}
function navIsOpen() {
  return mq.matches ? root.classList.contains('nav-open') : !root.classList.contains('nav-closed');
}
const initial = () => (mq.matches ? false : load('nav') !== 'closed');
setNav(initial());
mq.addEventListener('change', () => setNav(initial()));
toggle.addEventListener('click', () => {
  const open = !navIsOpen();
  setNav(open);
  if (!mq.matches) store('nav', open ? 'open' : 'closed');
});
document.getElementById('scrim')!.addEventListener('click', () => setNav(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mq.matches && navIsOpen()) { setNav(false); toggle.focus(); }
});

/* カテゴリの開閉。見た目（data-open）と読み上げ用の状態（aria-expanded）を必ず一緒に変える */
function setCatOpen(cat: Element, open: boolean) {
  cat.setAttribute('data-open', String(open));
  cat.querySelector('[data-toggle-cat]')?.setAttribute('aria-expanded', String(open));
}
document.querySelectorAll<HTMLButtonElement>('[data-toggle-cat]').forEach((btn) => {
  const cat = btn.closest('.nav-cat')!;
  setCatOpen(cat, cat.getAttribute('data-open') === 'true');
  btn.addEventListener('click', () => setCatOpen(cat, cat.getAttribute('data-open') !== 'true'));
});

/* 検索：メニューのレシピを絞り込む */
const q = document.getElementById('q') as HTMLInputElement | null;
q?.addEventListener('input', () => {
  const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  document.querySelectorAll<HTMLElement>('.nav-cat').forEach((cat) => {
    let hit = false;
    cat.querySelectorAll<HTMLElement>('[data-title]').forEach((item) => {
      const text = item.dataset.title!.toLowerCase();
      const ok = words.every((w) => text.includes(w));
      item.hidden = !ok;
      if (ok) hit = true;
    });
    cat.hidden = words.length > 0 && !hit;
    if (words.length && hit) setCatOpen(cat, true);
  });
});

/* コピー：使えない環境では全文を選択して Ctrl+C を案内する */
const COPY_BY_HAND = '全文を選択しました。Ctrl+C（Macは⌘+C）でコピーしてください。';
function selectText(el: HTMLElement) {
  const r = document.createRange();
  r.selectNodeContents(el);
  const s = window.getSelection();
  s?.removeAllRanges();
  s?.addRange(r);
}
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.copy!;
    const pre = document.getElementById(id)!;
    const msg = document.querySelector<HTMLElement>(`[data-msg="${id}"]`);
    const label = btn.querySelector('span')!;
    const original = label.textContent;
    const ok = () => {
      btn.classList.add('done');
      label.textContent = 'コピーしました';
      if (msg) msg.textContent = 'AIの入力欄に貼り付けてください。';
      setTimeout(() => { btn.classList.remove('done'); label.textContent = original; }, 2200);
    };
    const fallback = () => {
      // メニューのボタンは本文が見えないため、レシピのページの該当プロンプトを開いて選択する
      if (btn.dataset.fallback) {
        const url = new URL(btn.dataset.fallback, location.href);
        if (url.pathname !== location.pathname) { location.href = url.href; return; }
        // 表示中のレシピなら、ページを移動せずにその場で開く（同じページへのハッシュ移動では再読み込みされないため）
        if (mq.matches) setNav(false);
        history.replaceState(null, '', url.hash);
        revealPrompt(decodeURIComponent(url.hash.slice(1)));
        return;
      }
      const panel = pre.closest<HTMLElement>('.panel');
      if (panel) setExpanded(panel, true); // ボタンの表示と aria-expanded も一緒に「展開」にする
      selectText(pre);
      if (msg) msg.textContent = COPY_BY_HAND;
    };
    try {
      navigator.clipboard.writeText(pre.textContent ?? '').then(ok, fallback);
    } catch {
      fallback();
    }
  });
});

/* プロンプトの全文表示 */
function setExpanded(panel: HTMLElement, open: boolean) {
  panel.classList.toggle('open', open);
  const btn = panel.querySelector<HTMLButtonElement>('.expand');
  if (btn) {
    btn.textContent = open ? '折りたたむ ▴' : '全文を表示 ▾';
    btn.setAttribute('aria-expanded', String(open));
  }
}
document.querySelectorAll<HTMLButtonElement>('.expand').forEach((btn) => {
  btn.addEventListener('click', () => {
    const panel = btn.closest<HTMLElement>('.panel')!;
    setExpanded(panel, !panel.classList.contains('open'));
  });
});
/** プロンプト（id は step1-extract など、パネルを囲む要素のID）を開いて全文を選択し、手でコピーするよう案内する */
function revealPrompt(id: string) {
  const target = document.getElementById(id);
  const panel = target?.querySelector<HTMLElement>('.panel');
  const pre = panel?.querySelector('pre');
  // 見出しなど、プロンプト以外への移動（#長すぎて送れないとき など）では何もしない
  if (!target || !panel || !pre || pre.id !== `p-${id}`) return;
  setExpanded(panel, true);
  target.scrollIntoView({ block: 'start' });
  selectText(pre);
  const msg = document.querySelector<HTMLElement>(`[data-msg="${pre.id}"]`);
  if (msg) msg.textContent = COPY_BY_HAND;
}
// メニューのコピーに失敗して別のページから移動してきたときも、そのプロンプトを開いて選択しておく
if (location.hash) revealPrompt(decodeURIComponent(location.hash.slice(1)));

/* チェックリストの進み具合 */
document.querySelectorAll<HTMLElement>('.check-block').forEach((block) => {
  const boxes = Array.from(block.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
  const meter = block.querySelector<HTMLElement>('.meter i')!;
  const progress = block.querySelector<HTMLElement>('.progress')!;
  const update = () => {
    const n = boxes.filter((b) => b.checked).length;
    meter.style.width = `${(n / boxes.length) * 100}%`;
    progress.textContent = `${n} / ${boxes.length} 確認済み` + (n === boxes.length ? ' · 準備ができました' : '');
  };
  boxes.forEach((b) => b.addEventListener('change', update));
});
