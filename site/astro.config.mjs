// @ts-check
import { defineConfig } from 'astro/config';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
// サイトの外にある素材。開発サーバーで変更を見張る
const CONTENT_DIRS = [path.join(ROOT, 'recipes'), path.join(ROOT, 'guides')];

/**
 * 素材（page.md、prompts/*.txt など）を保存したら、ページの一覧を作り直し、ブラウザを自動で再読み込みする。
 * 開発サーバーは getStaticPaths の結果（どのURLのページがあるか）を使い回すため、
 * 知らせないと、起動後に増やしたレシピやガイドのページが「見つかりません」になる
 */
function watchContent() {
  return {
    name: 'watch-recipes-and-guides',
    /** @param {import('vite').ViteDevServer} server */
    configureServer(server) {
      server.watcher.add(CONTENT_DIRS);
      server.watcher.on('all', (_event, file) => {
        if (!CONTENT_DIRS.some((dir) => file.startsWith(dir + path.sep))) return;
        // サーバー側でページを作る環境に、コンテンツが変わったことを知らせる（Astro がページの一覧を作り直す）
        for (const [name, env] of Object.entries(server.environments)) {
          if (name !== 'client') env.hot.send('astro:content-changed', {});
        }
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}

export default defineConfig({
  site: 'https://ai-work-recipes.tariki-code.tokyo',
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: {
    // サイトの外（../recipes, ../guides）の素材を読むため
    server: { fs: { allow: ['..'] } },
    plugins: [watchContent()],
  },
});
