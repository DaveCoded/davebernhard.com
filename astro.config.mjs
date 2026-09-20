// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import { clickToSource } from 'astro-click-to-source';

// https://astro.build/config
export default defineConfig({
  site: 'https://davebernhard.com',
  integrations: [mdx(), sitemap(), clickToSource()],
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'ET Book',
      cssVariable: '--font-etbook',
      fallbacks: [
        'ET Book Mac and Windows Fallback',
        'ET Book Linux Fallback',
        'ET Book Generic Fallback',
      ],
      optimizedFallbacks: false,
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/et-book/et-book-roman.woff2'],
            weight: 400,
            style: 'normal',
            display: 'swap',
          },
          {
            src: ['./src/assets/fonts/et-book/et-book-italic.woff2'],
            weight: 400,
            style: 'italic',
            display: 'swap',
          },
          {
            src: ['./src/assets/fonts/et-book/et-book-bold.woff2'],
            weight: 700,
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
  ],
  markdown: {
    shikiConfig: {
      theme: 'rose-pine-dawn',
    },
  },
});
