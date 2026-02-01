import { e as createAstro, f as createComponent, m as maybeRenderHead, h as addAttribute, o as renderSlot, r as renderTemplate } from './astro/server_DnVpOiel.mjs';
import 'piccolore';
import 'clsx';

const $$Astro = createAstro("https://example.com");
const $$Container = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Container;
  const { class: className } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div${addAttribute(["max-w-screen-xl mx-auto px-5", className], "class:list")}> ${renderSlot($$result, $$slots["default"])} </div>`;
}, "/c/Users/15034/Projects/ResaleCommand/src/components/elements/Container.astro", void 0);

export { $$Container as $ };
