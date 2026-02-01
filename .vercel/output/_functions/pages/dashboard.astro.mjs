import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DnVpOiel.mjs';
import 'piccolore';
import { $ as $$CameraCapture } from '../chunks/CameraCapture_C50RcEcg.mjs';
import { $ as $$Layout } from '../chunks/Layout_zJLxYUXV.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://example.com");
const $$Dashboard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Dashboard;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container mx-auto px-4 py-8"> <div class="text-center mb-8"> <h1 class="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
Resale Command Dashboard
</h1> <p class="text-lg opacity-70">
AI-Powered Resale Inventory Assistant
</p> </div> ${renderComponent($$result2, "CameraCapture", $$CameraCapture, {})} <div class="mt-12 text-center text-sm opacity-50"> <p>Powered by Gemini AI + Appwrite + Astro + DaisyUI</p> </div> </div> ` })}`;
}, "/c/Users/15034/Projects/ResaleCommand/src/pages/dashboard.astro", void 0);

const $$file = "/c/Users/15034/Projects/ResaleCommand/src/pages/dashboard.astro";
const $$url = "/dashboard";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Dashboard,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
