import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, l as Fragment } from '../chunks/astro/server_DnVpOiel.mjs';
import 'piccolore';
import { $ as $$Sectionhead } from '../chunks/Sectionhead_Drbg0gnu.mjs';
import { $ as $$Layout } from '../chunks/Layout_zJLxYUXV.mjs';
export { renderers } from '../renderers.mjs';

const $$Imprint = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Kontakt" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="md:max-w-3xl max-w-screen-xl mx-auto px-5"> ${renderComponent($$result2, "Sectionhead", $$Sectionhead, {}, { "desc": ($$result3) => renderTemplate`${renderComponent($$result3, "Fragment", Fragment, { "slot": "desc" }, { "default": ($$result4) => renderTemplate` Your Company Name` })}`, "title": ($$result3) => renderTemplate`${renderComponent($$result3, "Fragment", Fragment, { "slot": "title" }, { "default": ($$result4) => renderTemplate`Imprint` })}` })} <h2 class="text-3xl mt-6 lg:text-3xl font-bold lg:tracking-tight">Informations about Service provider.</h2> <div class="text-lg mt-6 mb-6 text-slate-900 max-w-xl"> <p> <strong>Yea</strong> </p> <p>Max Mustermann</p> <p>Some street, <br>012345 Berlin, <br>Germany</p> <p> <strong>Tel.:</strong> +49 10101010<br> <strong>E-Mail:</strong> <a href="mailto:kontakt@example.com">kontakt@example.com</a> </p> </div> </section> ` })}`;
}, "/c/Users/15034/Projects/ResaleCommand/src/pages/imprint.astro", void 0);

const $$file = "/c/Users/15034/Projects/ResaleCommand/src/pages/imprint.astro";
const $$url = "/imprint";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Imprint,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
