// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ai-work-recipes.tariki-code.tokyo',
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: {
    // サイトの外（../recipes, ../guides）の素材を読むため
    server: { fs: { allow: ['..'] } },
  },
});
