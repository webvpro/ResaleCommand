import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DnVpOiel.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_zJLxYUXV.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Resale Command | AI Inventory Assistant" }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<div class="hero min-h-[70vh] bg-base-200"> <div class="hero-content text-center"> <div class="max-w-md"> <h1 class="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Resale Command</h1> <p class="py-6 text-lg">
Transform your resale business with AI. Identify items instantly, estimate value, and manage inventory with a single photo.
</p> <div class="flex gap-4 justify-center"> <a href="/login" class="btn btn-primary">Get Started</a> <a href="#features" class="btn btn-ghost">Learn More</a> </div> </div> </div> </div>  <div id="features" class="py-16 bg-base-100"> <div class="container mx-auto px-4"> <h2 class="text-3xl font-bold text-center mb-12">Why Resale Command?</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-8"> <!-- Feature 1 --> <div class="card bg-base-100 shadow-xl border border-base-200"> <div class="card-body items-center text-center"> <div class="text-4xl mb-4">📸</div> <h2 class="card-title">Instant Identification</h2> <p>Snap a photo and let Gemini AI identify your item, condition, and keywords automatically.</p> </div> </div> <!-- Feature 2 --> <div class="card bg-base-100 shadow-xl border border-base-200"> <div class="card-body items-center text-center"> <div class="text-4xl mb-4">💰</div> <h2 class="card-title">Smart Valuation</h2> <p>Get instant price estimates (Mint, Fair, Poor) and calculate your max buy price to ensure profit.</p> </div> </div> <!-- Feature 3 --> <div class="card bg-base-100 shadow-xl border border-base-200"> <div class="card-body items-center text-center"> <div class="text-4xl mb-4">📦</div> <h2 class="card-title">Inventory Management</h2> <p>Organize your finds into teams, track bins, and export listing drafts effortlessly.</p> </div> </div> </div> </div> </div>  <div class="bg-primary text-primary-content py-16"> <div class="container mx-auto px-4 text-center"> <h2 class="text-3xl font-bold mb-4">Ready to Scale?</h2> <p class="mb-8">Join resellers scanning thousands of items daily.</p> <a href="/signup" class="btn btn-secondary btn-lg">Join Now - Free</a> </div> </div> ` })}`;
}, "/c/Users/15034/Projects/ResaleCommand/src/pages/index.astro", void 0);

const $$file = "/c/Users/15034/Projects/ResaleCommand/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
