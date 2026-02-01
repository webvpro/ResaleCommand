import { f as createComponent, k as renderComponent, r as renderTemplate, l as Fragment, m as maybeRenderHead } from '../chunks/astro/server_DnVpOiel.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_zJLxYUXV.mjs';
import { $ as $$CameraCapture } from '../chunks/CameraCapture_C50RcEcg.mjs';
import { $ as $$Container } from '../chunks/Container_BvEMnW2o.mjs';
import { $ as $$Sectionhead } from '../chunks/Sectionhead_Drbg0gnu.mjs';
export { renderers } from '../renderers.mjs';

const $$Scan = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Scan Items | Resale Command" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Container", $$Container, {}, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Sectionhead", $$Sectionhead, {}, { "desc": ($$result4) => renderTemplate`${renderComponent($$result4, "Fragment", Fragment, { "slot": "desc" }, { "default": ($$result5) => renderTemplate`Use AI to identify items and estimate value instantly.` })}`, "title": ($$result4) => renderTemplate`${renderComponent($$result4, "Fragment", Fragment, { "slot": "title" }, { "default": ($$result5) => renderTemplate`Scan & Analyze` })}` })} ${maybeRenderHead()}<div class="mt-8"> ${renderComponent($$result3, "CameraCapture", $$CameraCapture, {})} </div> ` })} ` })}`;
}, "/c/Users/15034/Projects/ResaleCommand/src/pages/scan.astro", void 0);

const $$file = "/c/Users/15034/Projects/ResaleCommand/src/pages/scan.astro";
const $$url = "/scan";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Scan,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
