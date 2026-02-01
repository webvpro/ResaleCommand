import { f as createComponent, k as renderComponent, n as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DnVpOiel.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_zJLxYUXV.mjs';
export { renderers } from '../renderers.mjs';

const $$Login = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Login" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8" x-data="loginForm"> <div class="w-full max-w-md space-y-8"> <div> <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Sign in to your account</h2> </div> <form class="mt-8 space-y-6" @submit.prevent="submit"> <input type="hidden" name="remember" value="true"> <div class="-space-y-px rounded-md shadow-sm"> <div> <label for="email-address" class="sr-only">Email address</label> <input id="email-address" name="email" type="email" autocomplete="email" required x-model="email" class="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Email address"> </div> <div> <label for="password" class="sr-only">Password</label> <input id="password" name="password" type="password" autocomplete="current-password" required x-model="password" class="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Password"> </div> </div> <div class="flex items-center justify-between"> <div class="text-sm"> <a href="/signup" class="font-medium text-indigo-600 hover:text-indigo-500">Don't have an account? Sign up</a> </div> </div> <div> <button type="submit" :disabled="loading" class="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"> <span class="absolute inset-y-0 left-0 flex items-center pl-3"> <svg class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"> <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"></path> </svg> </span> <span x-show="!loading">Sign in</span> <span x-show="loading">Signing in...</span> </button> </div> <div x-show="error" class="text-red-500 text-sm text-center" x-text="error"></div> </form> </div> </div> ` })} ${renderScript($$result, "/c/Users/15034/Projects/ResaleCommand/src/pages/login.astro?astro&type=script&index=0&lang.ts")}`;
}, "/c/Users/15034/Projects/ResaleCommand/src/pages/login.astro", void 0);

const $$file = "/c/Users/15034/Projects/ResaleCommand/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
