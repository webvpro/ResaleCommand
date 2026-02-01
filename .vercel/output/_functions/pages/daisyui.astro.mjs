import { f as createComponent, m as maybeRenderHead, r as renderTemplate, k as renderComponent } from '../chunks/astro/server_DnVpOiel.mjs';
import 'piccolore';
import 'clsx';
import { $ as $$Layout } from '../chunks/Layout_zJLxYUXV.mjs';
export { renderers } from '../renderers.mjs';

const $$Buttons = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<section class="bg-base-100 py-12 mx-auto text-center"> <button class="btn btn-neutral">Neutral</button> <button class="btn btn-primary">Primary</button> <button class="btn btn-secondary">Secondary</button> <button class="btn btn-accent">Accent</button> <button class="btn btn-info">Info</button> <button class="btn btn-success">Success</button> <button class="btn btn-warning">Warning</button> <button class="btn btn-error">Error</button> </section>`;
}, "/c/Users/15034/Projects/ResaleCommand/src/components/daisyui/Buttons.astro", void 0);

const $$Daisyui = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Buttons", $$Buttons, {})} ` })}`;
}, "/c/Users/15034/Projects/ResaleCommand/src/pages/daisyui.astro", void 0);

const $$file = "/c/Users/15034/Projects/ResaleCommand/src/pages/daisyui.astro";
const $$url = "/daisyui";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Daisyui,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
