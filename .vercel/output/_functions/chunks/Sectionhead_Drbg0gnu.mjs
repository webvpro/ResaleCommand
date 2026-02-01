import { e as createAstro, f as createComponent, m as maybeRenderHead, h as addAttribute, o as renderSlot, r as renderTemplate } from './astro/server_DnVpOiel.mjs';
import 'piccolore';
import 'clsx';

const $$Astro = createAstro("https://example.com");
const $$Sectionhead = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Sectionhead;
  const { align = "center" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div${addAttribute(["mt-16", align === "center" && "text-center"], "class:list")}> <h1 class="text-4xl lg:text-5xl font-bold lg:tracking-tight"> ${renderSlot($$result, $$slots["title"], renderTemplate`Title`)} </h1> <p class="text-base md:text-lg mt-4 text-slate-600"> ${renderSlot($$result, $$slots["desc"], renderTemplate`Some description goes here`)} </p> </div>`;
}, "/c/Users/15034/Projects/ResaleCommand/src/components/elements/Sectionhead.astro", void 0);

export { $$Sectionhead as $ };
