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

/* カテゴリの開閉 */
document.querySelectorAll<HTMLButtonElement>('[data-toggle-cat]').forEach((btn) => {
  const li = btn.closest('.nav-cat')!;
  btn.setAttribute('aria-expanded', li.getAttribute('data-open')!);
  btn.addEventListener('click', () => {
    const open = li.getAttribute('data-open') !== 'true';
    li.setAttribute('data-open', String(open));
    btn.setAttribute('aria-expanded', String(open));
  });
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
    if (words.length && hit) cat.setAttribute('data-open', 'true');
  });
});

/* コピー：使えない環境では全文を選択して Ctrl+C を案内する */
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
      // メニューのボタンは本文が見えないため、レシピのページの該当プロンプトへ移動する
      if (btn.dataset.fallback) { location.href = btn.dataset.fallback; return; }
      pre.closest('.panel')?.classList.add('open');
      selectText(pre);
      if (msg) msg.textContent = '全文を選択しました。Ctrl+C（Macは⌘+C）でコピーしてください。';
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
// メニューのコピーから移動してきたときは、そのプロンプトを開いて選択しておく
if (location.hash) {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  const panel = target?.querySelector<HTMLElement>('.panel');
  if (panel) {
    setExpanded(panel, true);
    const pre = panel.querySelector('pre');
    if (pre) selectText(pre);
  }
}

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
