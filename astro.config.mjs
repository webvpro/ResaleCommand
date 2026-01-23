import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import netlify from "@astrojs/netlify";
// import node from "@astrojs/node";

import alpinejs from "@astrojs/alpinejs";


// https://astro.build/config
export default defineConfig({
  output: 'server',
  site: "https://example.com",
  trailingSlash: "never",
  integrations: [mdx(), sitemap(), icon(), alpinejs()],
  adapter: netlify(),
  // adapter: node({
  //   mode: 'standalone'
  // }),
  vite: {
    plugins: [tailwindcss()],
  },
});