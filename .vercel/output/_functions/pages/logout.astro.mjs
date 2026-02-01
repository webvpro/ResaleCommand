import { f as createComponent, k as renderComponent, n as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DnVpOiel.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_zJLxYUXV.mjs';
export { renderers } from '../renderers.mjs';

const $$Logout = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Logging out..." }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex min-h-screen items-center justify-center bg-gray-50" x-data="logoutPage"> <div class="text-center"> <h2 class="text-2xl font-bold mb-4">Logging out...</h2> <span class="loading loading-spinner loading-lg text-primary"></span> </div> </div> ` })} ${renderScript($$result, "/c/Users/15034/Projects/ResaleCommand/src/pages/logout.astro?astro&type=script&index=0&lang.ts")}`;
}, "/c/Users/15034/Projects/ResaleCommand/src/pages/logout.astro", void 0);

const $$file = "/c/Users/15034/Projects/ResaleCommand/src/pages/logout.astro";
const $$url = "/logout";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Logout,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
