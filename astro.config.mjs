import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [svelte(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  site: 'https://roadbike.vercel.app',
});
