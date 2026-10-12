// @ts-check
import { defineConfig } from 'astro/config';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
// サイトの外にある素材。開発サーバーで変更を見張る
const CONTENT_DIRS = [path.join(ROOT, 'recipes'), path.join(ROOT, 'guides')];

/** 素材（page.md、prompts/*.txt など）を保存したら、ブラウザを自動で再読み込みする */
function watchContent() {
  return {
    name: 'watch-recipes-and-guides',
    /** @param {import('vite').ViteDevServer} server */
    configureServer(server) {
      server.watcher.add(CONTENT_DIRS);
      server.watcher.on('all', (_event, file) => {
        if (CONTENT_DIRS.some((dir) => file.startsWith(dir + path.sep))) {
          server.ws.send({ type: 'full-reload' });
        }
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
