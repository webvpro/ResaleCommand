import { f as createComponent, k as renderComponent, n as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DnVpOiel.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_zJLxYUXV.mjs';
export { renderers } from '../renderers.mjs';

const $$Join = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Joining Team..." }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8" x-data="joinTeam"> <div class="w-full max-w-md space-y-8 text-center"> <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">Joining Team...</h2> <div x-show="loading" class="loading loading-spinner loading-lg text-primary"></div> <div x-show="error" class="text-red-500" x-text="error"></div> <div x-show="success" class="text-green-500">
Successfully joined! Redirecting...
</div> </div> </div> ` })} ${renderScript($$result, "/c/Users/15034/Projects/ResaleCommand/src/pages/join.astro?astro&type=script&index=0&lang.ts")}`;
}, "/c/Users/15034/Projects/ResaleCommand/src/pages/join.astro", void 0);

const $$file = "/c/Users/15034/Projects/ResaleCommand/src/pages/join.astro";
const $$url = "/join";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Join,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
