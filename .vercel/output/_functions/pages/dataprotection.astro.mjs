import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, l as Fragment } from '../chunks/astro/server_DnVpOiel.mjs';
import 'piccolore';
import { $ as $$Sectionhead } from '../chunks/Sectionhead_Drbg0gnu.mjs';
import { $ as $$Layout } from '../chunks/Layout_zJLxYUXV.mjs';
export { renderers } from '../renderers.mjs';

const $$Dataprotection = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Kontakt" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="max-w-screen-xl mx-auto px-5"> ${renderComponent($$result2, "Sectionhead", $$Sectionhead, {}, { "desc": ($$result3) => renderTemplate`${renderComponent($$result3, "Fragment", Fragment, { "slot": "desc" }, { "default": ($$result4) => renderTemplate`Your company` })}`, "title": ($$result3) => renderTemplate`${renderComponent($$result3, "Fragment", Fragment, { "slot": "title" }, { "default": ($$result4) => renderTemplate`Dataprotection` })}` })} </section> ` })}`;
}, "/c/Users/15034/Projects/ResaleCommand/src/pages/dataprotection.astro", void 0);

const $$file = "/c/Users/15034/Projects/ResaleCommand/src/pages/dataprotection.astro";
const $$url = "/dataprotection";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Dataprotection,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
