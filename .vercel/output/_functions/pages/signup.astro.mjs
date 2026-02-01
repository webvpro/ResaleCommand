import { f as createComponent, k as renderComponent, n as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DnVpOiel.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_zJLxYUXV.mjs';
export { renderers } from '../renderers.mjs';

const $$Signup = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Sign Up" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8" x-data="signupForm"> <div class="w-full max-w-md space-y-8"> <div> <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Create your account</h2> </div> <form class="mt-8 space-y-6" @submit.prevent="submit"> <div class="-space-y-px rounded-md shadow-sm"> <div> <label for="name" class="sr-only">Full Name</label> <input id="name" name="name" type="text" autocomplete="name" required x-model="name" class="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Full Name"> </div> <div> <label for="email-address" class="sr-only">Email address</label> <input id="email-address" name="email" type="email" autocomplete="email" required x-model="email" class="relative block w-full border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Email address"> </div> <div> <label for="password" class="sr-only">Password</label> <input id="password" name="password" type="password" autocomplete="new-password" required x-model="password" class="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Password"> </div> </div> <div class="flex items-center justify-between"> <div class="text-sm"> <a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">Already have an account? Sign in</a> </div> </div> <div> <button type="submit" :disabled="loading" class="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"> <span x-show="!loading">Sign up</span> <span x-show="loading">Signing up...</span> </button> </div> <div x-show="error" class="text-red-500 text-sm text-center" x-text="error"></div> </form> </div> </div> ` })} ${renderScript($$result, "/c/Users/15034/Projects/ResaleCommand/src/pages/signup.astro?astro&type=script&index=0&lang.ts")}`;
}, "/c/Users/15034/Projects/ResaleCommand/src/pages/signup.astro", void 0);

const $$file = "/c/Users/15034/Projects/ResaleCommand/src/pages/signup.astro";
const $$url = "/signup";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Signup,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
