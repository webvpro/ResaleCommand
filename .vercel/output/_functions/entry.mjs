import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_BGlxZ0wU.mjs';
import { manifest } from './manifest_B0fI5sDV.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/api/generate-description.astro.mjs');
const _page3 = () => import('./pages/api/identify-item.astro.mjs');
const _page4 = () => import('./pages/daisyui.astro.mjs');
const _page5 = () => import('./pages/dashboard.astro.mjs');
const _page6 = () => import('./pages/dataprotection.astro.mjs');
const _page7 = () => import('./pages/imprint.astro.mjs');
const _page8 = () => import('./pages/inventory.astro.mjs');
const _page9 = () => import('./pages/join.astro.mjs');
const _page10 = () => import('./pages/login.astro.mjs');
const _page11 = () => import('./pages/logout.astro.mjs');
const _page12 = () => import('./pages/scan.astro.mjs');
const _page13 = () => import('./pages/signup.astro.mjs');
const _page14 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/api/generate-description.ts", _page2],
    ["src/pages/api/identify-item.ts", _page3],
    ["src/pages/daisyui.astro", _page4],
    ["src/pages/dashboard.astro", _page5],
    ["src/pages/dataprotection.astro", _page6],
    ["src/pages/imprint.astro", _page7],
    ["src/pages/inventory.astro", _page8],
    ["src/pages/join.astro", _page9],
    ["src/pages/login.astro", _page10],
    ["src/pages/logout.astro", _page11],
    ["src/pages/scan.astro", _page12],
    ["src/pages/signup.astro", _page13],
    ["src/pages/index.astro", _page14]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "747e97e1-f51c-4e4b-b7e6-043e860570d6",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
