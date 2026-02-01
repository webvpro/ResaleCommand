import { f as createComponent, m as maybeRenderHead, r as renderTemplate, e as createAstro, h as addAttribute, s as spreadAttributes, u as unescapeHTML, k as renderComponent, p as renderHead, o as renderSlot, n as renderScript } from './astro/server_DnVpOiel.mjs';
import 'piccolore';
import { computed, useSSRContext, defineComponent, ref, mergeProps } from 'vue';
import { useStore } from '@nanostores/vue';
import { map } from 'nanostores';
import { Client, Account, Databases, Storage, Teams, ID } from 'appwrite';
import { ssrRenderAttrs, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderClass, ssrRenderStyle, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import 'clsx';
/* empty css                           */

const client = new Client();
client.setEndpoint("https://sfo.cloud.appwrite.io/v1").setProject("69714b35003a8adab6bb");
const account = new Account(client);
const databases = new Databases(client);
new Storage(client);
const teams = new Teams(client);

const auth = {
  async login(email, password) {
    try {
      await account.createEmailPasswordSession(email, password);
      return await this.getCurrentUser();
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },
  async register(email, password, name) {
    try {
      await account.create(ID.unique(), email, password, name);
      return await this.login(email, password);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },
  async logout() {
    try {
      await account.deleteSession("current");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
    }
  },
  async getCurrentUser() {
    try {
      return await account.get();
    } catch (error) {
      return null;
    }
  },
  async isPartner(user) {
    if (!user) return false;
    return user.labels.includes("partner");
  },
  async getTeams() {
    try {
      const response = await teams.list();
      return response.teams;
    } catch (error) {
      console.error("Error fetching teams:", error);
      return [];
    }
  },
  async getOwnedTeam(userId) {
    try {
      const allTeams = await this.getTeams();
      for (const team of allTeams) {
        try {
          const response = await teams.listMemberships(team.$id);
          const myMembership = response.memberships.find((m) => m.userId === userId);
          if (myMembership && myMembership.roles.includes("owner")) {
            return team;
          }
        } catch (e) {
          console.warn(`Failed to checking membership for team ${team.$id}`, e);
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting owned team:", error);
      return null;
    }
  },
  async createTeam(name) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error("User not logged in");
      const ownedTeam = await this.getOwnedTeam(user.$id);
      if (ownedTeam) {
        throw new Error(`You can only own one organization. You already own: ${ownedTeam.name}`);
      }
      return await teams.create(ID.unique(), name);
    } catch (error) {
      console.error("Error creating team:", error);
      throw error;
    }
  },
  async inviteMember(teamId, email) {
    try {
      const url = `${window.location.origin}/join`;
      return await teams.createMembership(teamId, ["member"], email, ID.unique(), void 0, url);
    } catch (error) {
      console.error("Error inviting member:", error);
      throw error;
    }
  },
  async acceptInvite(teamId, membershipId, userId, secret) {
    try {
      return await teams.updateMembershipStatus(teamId, membershipId, userId, secret);
    } catch (error) {
      console.error("Error accepting invite:", error);
      throw error;
    }
  }
};

const authStore = map({
  user: null,
  isAuthenticated: false,
  isPartner: false,
  teams: [],
  currentTeam: null,
  ownedTeam: null,
  loading: true
});
async function initAuth() {
  console.log("Auth init started (Global)");
  try {
    const currentUser = await auth.getCurrentUser();
    if (currentUser) {
      const teamsList = await auth.getTeams();
      const owned = await auth.getOwnedTeam(currentUser.$id);
      const storedTeamId = localStorage.getItem("activeTeamId");
      let active = null;
      if (storedTeamId) {
        active = teamsList.find((t) => t.$id === storedTeamId) || null;
      }
      authStore.set({
        user: currentUser,
        isAuthenticated: true,
        isPartner: currentUser.labels.includes("partner"),
        teams: teamsList,
        ownedTeam: owned,
        currentTeam: active,
        loading: false
      });
      if (active) {
        window.dispatchEvent(new CustomEvent("team-changed", { detail: { teamId: active.$id } }));
      }
    } else {
      authStore.setKey("loading", false);
    }
  } catch (error) {
    console.error("Auth init error:", error);
    authStore.setKey("loading", false);
  }
}
async function register(email, pass, name) {
  await auth.register(email, pass, name);
  await initAuth();
}
async function login(email, pass) {
  await auth.login(email, pass);
  await initAuth();
}
async function logout() {
  await auth.logout();
  authStore.set({
    user: null,
    isAuthenticated: false,
    isPartner: false,
    teams: [],
    currentTeam: null,
    ownedTeam: null,
    loading: false
  });
  localStorage.removeItem("activeTeamId");
  window.location.href = "/login";
}
async function switchTeam(team) {
  authStore.setKey("currentTeam", team);
  if (team) {
    localStorage.setItem("activeTeamId", team.$id);
  } else {
    localStorage.removeItem("activeTeamId");
  }
  window.dispatchEvent(new CustomEvent("team-changed", { detail: { teamId: team ? team.$id : null } }));
}
async function createTeam(name) {
  const newTeam = await auth.createTeam(name);
  const teamsList = await auth.getTeams();
  authStore.setKey("teams", teamsList);
  authStore.setKey("ownedTeam", newTeam);
  switchTeam(newTeam);
}
async function inviteMember(teamId, email) {
  await auth.inviteMember(teamId, email);
}

function useAuth() {
  const state = useStore(authStore);
  const user = computed(() => state.value.user);
  const isAuthenticated = computed(() => state.value.isAuthenticated);
  const isPartner = computed(() => state.value.isPartner);
  const teams = computed(() => state.value.teams);
  const currentTeam = computed(() => state.value.currentTeam);
  const ownedTeam = computed(() => state.value.ownedTeam);
  const loading = computed(() => state.value.loading);
  return {
    // State
    user,
    isAuthenticated,
    isPartner,
    teams,
    currentTeam,
    ownedTeam,
    loading,
    // Actions
    init: initAuth,
    login: login,
    register: register,
    logout: logout,
    switchTeam: switchTeam,
    createTeam: createTeam,
    inviteMember: inviteMember
  };
}

const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "Navbar",
  setup(__props, { expose: __expose }) {
    __expose();
    const navLinks = [
      { text: "Dashboard", url: "/dashboard" },
      { text: "Inventory", url: "/inventory" },
      { text: "Partners", url: "/partners" }
    ];
    const {
      user,
      isAuthenticated,
      currentTeam,
      teams,
      ownedTeam,
      isPartner,
      loading,
      switchTeam,
      createTeam,
      inviteMember,
      logout: authLogout
    } = useAuth();
    const openMobile = ref(false);
    const showCreateModal = ref(false);
    const showInviteModal = ref(false);
    const newTeamName = ref("");
    const inviteEmail = ref("");
    const userInitial = computed(() => {
      return user.value && user.value.name ? user.value.name.charAt(0).toUpperCase() : "?";
    });
    const logout = async () => {
      await authLogout();
    };
    const handleSwitchTeam = async (team) => {
      await switchTeam(team);
    };
    const handleCreateTeam = async () => {
      if (!newTeamName.value) return;
      try {
        await createTeam(newTeamName.value);
        showCreateModal.value = false;
        newTeamName.value = "";
      } catch (e) {
        alert(e.message);
      }
    };
    const handleInvite = async () => {
      if (!inviteEmail.value || !currentTeam.value) return;
      try {
        await inviteMember(currentTeam.value.$id, inviteEmail.value);
        showInviteModal.value = false;
        inviteEmail.value = "";
        alert("Invitation sent!");
      } catch (e) {
        alert(e.message);
      }
    };
    const __returned__ = { navLinks, user, isAuthenticated, currentTeam, teams, ownedTeam, isPartner, loading, switchTeam, createTeam, inviteMember, authLogout, openMobile, showCreateModal, showInviteModal, newTeamName, inviteEmail, userInitial, logout, handleSwitchTeam, handleCreateTeam, handleInvite };
    Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
    return __returned__;
  }
});
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<nav${ssrRenderAttrs(mergeProps({ class: "navbar max-w-screen-lx mx-auto" }, _attrs))}><div class="navbar-start md:pl-2 lg:pl-8"><a href="/" class="btn btn-ghost text-xl font-bold text-primary">Resale Command</a></div><div class="navbar-center"></div><div class="navbar-end md:pr-2 lg:pr-8"><!--[-->`);
  ssrRenderList($setup.navLinks, (link) => {
    _push(`<a${ssrRenderAttr("href", link.url)} class="hidden md:inline-flex btn btn-lg btn-ghost hover:bg-base-200">${ssrInterpolate(link.text)}</a>`);
  });
  _push(`<!--]-->`);
  if ($setup.loading) {
    _push(`<div class="hidden md:inline-flex items-center gap-2"><button class="btn btn-ghost"><span class="loading loading-spinner loading-sm"></span></button></div>`);
  } else {
    _push(`<div class="hidden md:inline-flex items-center gap-2">`);
    if (!$setup.isAuthenticated) {
      _push(`<a href="/login" class="btn btn-ghost">Login</a>`);
    } else {
      _push(`<div class="flex items-center gap-2"><div class="dropdown dropdown-end mr-2"><div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-2"><span>${ssrInterpolate($setup.currentTeam ? $setup.currentTeam.name : "Personal Inventory")}</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"></path></svg></div><ul tabindex="0" class="dropdown-content z-[50] menu p-2 shadow bg-base-100 rounded-box w-52"><li><a class="${ssrRenderClass({ active: !$setup.currentTeam })}">Personal Inventory</a></li><!--[-->`);
      ssrRenderList($setup.teams, (team) => {
        _push(`<li><a class="${ssrRenderClass({ active: $setup.currentTeam && $setup.currentTeam.$id === team.$id })}">${ssrInterpolate(team.name)}</a></li>`);
      });
      _push(`<!--]--><div class="divider my-0"></div>`);
      if (!$setup.ownedTeam) {
        _push(`<li><a>+ Create Organization</a></li>`);
      } else {
        _push(`<!---->`);
      }
      if ($setup.currentTeam && $setup.ownedTeam && $setup.currentTeam.$id === $setup.ownedTeam.$id) {
        _push(`<li><a>+ Invite Member</a></li>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</ul></div><div class="dropdown dropdown-end"><div tabindex="0" role="button" class="btn btn-ghost avatar placeholder cursor-pointer"><div class="bg-neutral text-neutral-content rounded-full w-10"><span class="text-xs">${ssrInterpolate($setup.userInitial)}</span></div></div><ul tabindex="0" class="mt-3 z-50 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">`);
      if ($setup.isPartner) {
        _push(`<li><div class="badge badge-secondary w-full">Partner</div></li>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<li><a>Logout</a></li></ul></div></div>`);
    }
    _push(`</div>`);
  }
  _push(`<button class="btn btn-square btn-ghost md:hidden" aria-label="Menü öffnen"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" inline-block class="w-5 h-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg></button><div class="fixed inset-0 bg-primary flex flex-col items-center justify-center space-y-6 z-50 transition-all" style="${ssrRenderStyle($setup.openMobile ? null : { display: "none" })}"><button class="absolute top-6 right-6 text-4xl focus:outline-none">×</button><!--[-->`);
  ssrRenderList($setup.navLinks, (link) => {
    _push(`<a${ssrRenderAttr("href", link.url)} class="text-2xl text-primary-content hover:text-accent">${ssrInterpolate(link.text)}</a>`);
  });
  _push(`<!--]-->`);
  if (!$setup.loading) {
    _push(`<div class="flex flex-col items-center gap-4">`);
    if (!$setup.isAuthenticated) {
      _push(`<a href="/login" class="text-2xl text-primary-content hover:text-accent">Login</a>`);
    } else {
      _push(`<div class="flex flex-col items-center gap-2"><span class="text-lg font-bold text-primary-content">Hello, ${ssrInterpolate($setup.user ? $setup.user.name : "User")}</span>`);
      if ($setup.isPartner) {
        _push(`<span class="badge badge-secondary">Partner</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<a class="text-2xl text-primary-content hover:text-accent cursor-pointer">Logout</a></div>`);
    }
    _push(`</div>`);
  } else {
    _push(`<!---->`);
  }
  _push(`</div></div><dialog class="${ssrRenderClass([{ "modal-open": $setup.showCreateModal }, "modal"])}"><div class="modal-box"><h3 class="font-bold text-lg">Create New Organization</h3><p class="py-2 text-sm">Create a shared workspace.</p><div class="py-4"><input type="text" placeholder="Organization Name" class="input input-bordered w-full"${ssrRenderAttr("value", $setup.newTeamName)}></div><div class="modal-action"><button class="btn">Cancel</button><button class="btn btn-primary"${ssrIncludeBooleanAttr(!$setup.newTeamName) ? " disabled" : ""}>Create</button></div></div></dialog><dialog class="${ssrRenderClass([{ "modal-open": $setup.showInviteModal }, "modal"])}"><div class="modal-box"><h3 class="font-bold text-lg">Invite New Member</h3><p class="py-2 text-sm">Send an invitation email.</p><div class="py-4"><input type="email" placeholder="Email Address" class="input input-bordered w-full"${ssrRenderAttr("value", $setup.inviteEmail)}></div><div class="modal-action"><button class="btn">Cancel</button><button class="btn btn-primary"${ssrIncludeBooleanAttr(!$setup.inviteEmail) ? " disabled" : ""}>Send Invite</button></div></div></dialog></nav>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/nav/Navbar.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Navbar = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

const siteConfig = {
  title: "My Astro Site"};
const featureFlags = {
  enableDataprotection: false
};

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<footer class="my-20"> <div class="text-center text-sm text-slate-600 space-y-2"> <p> ${renderTemplate`<a class="hover:underline hover:text-primary-light" href="/imprint">Imprint</a>`} ${featureFlags.enableDataprotection} <span class="block sm:inline"> Copyright © ${(/* @__PURE__ */ new Date()).getFullYear()} StormbringerGames LLC.</span> </p> <div>
Made by Huckleberry Productions
</div> </div> </footer>`;
}, "/c/Users/15034/Projects/ResaleCommand/src/components/Footer.astro", void 0);

const $$Astro$9 = createAstro("https://example.com");
const $$OpenGraphArticleTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$9, $$props, $$slots);
  Astro2.self = $$OpenGraphArticleTags;
  const { publishedTime, modifiedTime, expirationTime, authors, section, tags } = Astro2.props.openGraph.article;
  return renderTemplate`${publishedTime ? renderTemplate`<meta property="article:published_time"${addAttribute(publishedTime, "content")}>` : null}${modifiedTime ? renderTemplate`<meta property="article:modified_time"${addAttribute(modifiedTime, "content")}>` : null}${expirationTime ? renderTemplate`<meta property="article:expiration_time"${addAttribute(expirationTime, "content")}>` : null}${authors ? authors.map((author) => renderTemplate`<meta property="article:author"${addAttribute(author, "content")}>`) : null}${section ? renderTemplate`<meta property="article:section"${addAttribute(section, "content")}>` : null}${tags ? tags.map((tag) => renderTemplate`<meta property="article:tag"${addAttribute(tag, "content")}>`) : null}`;
}, "/c/Users/15034/Projects/ResaleCommand/node_modules/astro-seo/src/components/OpenGraphArticleTags.astro", void 0);

const $$Astro$8 = createAstro("https://example.com");
const $$OpenGraphBasicTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
  Astro2.self = $$OpenGraphBasicTags;
  const { openGraph } = Astro2.props;
  return renderTemplate`<meta property="og:title"${addAttribute(openGraph.basic.title, "content")}><meta property="og:type"${addAttribute(openGraph.basic.type, "content")}><meta property="og:image"${addAttribute(openGraph.basic.image, "content")}><meta property="og:url"${addAttribute(openGraph.basic.url || Astro2.url.href, "content")}>`;
}, "/c/Users/15034/Projects/ResaleCommand/node_modules/astro-seo/src/components/OpenGraphBasicTags.astro", void 0);

const $$Astro$7 = createAstro("https://example.com");
const $$OpenGraphImageTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
  Astro2.self = $$OpenGraphImageTags;
  const { image } = Astro2.props.openGraph.basic;
  const { secureUrl, type, width, height, alt } = Astro2.props.openGraph.image;
  return renderTemplate`<meta property="og:image:url"${addAttribute(image, "content")}>${secureUrl ? renderTemplate`<meta property="og:image:secure_url"${addAttribute(secureUrl, "content")}>` : null}${type ? renderTemplate`<meta property="og:image:type"${addAttribute(type, "content")}>` : null}${width ? renderTemplate`<meta property="og:image:width"${addAttribute(width, "content")}>` : null}${height ? renderTemplate`<meta property="og:image:height"${addAttribute(height, "content")}>` : null}${alt ? renderTemplate`<meta property="og:image:alt"${addAttribute(alt, "content")}>` : null}`;
}, "/c/Users/15034/Projects/ResaleCommand/node_modules/astro-seo/src/components/OpenGraphImageTags.astro", void 0);

const $$Astro$6 = createAstro("https://example.com");
const $$OpenGraphOptionalTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$OpenGraphOptionalTags;
  const { optional } = Astro2.props.openGraph;
  return renderTemplate`${optional.audio ? renderTemplate`<meta property="og:audio"${addAttribute(optional.audio, "content")}>` : null}${optional.description ? renderTemplate`<meta property="og:description"${addAttribute(optional.description, "content")}>` : null}${optional.determiner ? renderTemplate`<meta property="og:determiner"${addAttribute(optional.determiner, "content")}>` : null}${optional.locale ? renderTemplate`<meta property="og:locale"${addAttribute(optional.locale, "content")}>` : null}${optional.localeAlternate?.map((locale) => renderTemplate`<meta property="og:locale:alternate"${addAttribute(locale, "content")}>`)}${optional.siteName ? renderTemplate`<meta property="og:site_name"${addAttribute(optional.siteName, "content")}>` : null}${optional.video ? renderTemplate`<meta property="og:video"${addAttribute(optional.video, "content")}>` : null}`;
}, "/c/Users/15034/Projects/ResaleCommand/node_modules/astro-seo/src/components/OpenGraphOptionalTags.astro", void 0);

const $$Astro$5 = createAstro("https://example.com");
const $$ExtendedTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$ExtendedTags;
  const { props } = Astro2;
  return renderTemplate`${props.extend.link?.map((attributes) => renderTemplate`<link${spreadAttributes(attributes)}>`)}${props.extend.meta?.map(({ content, httpEquiv, media, name, property }) => renderTemplate`<meta${addAttribute(name, "name")}${addAttribute(property, "property")}${addAttribute(content, "content")}${addAttribute(httpEquiv, "http-equiv")}${addAttribute(media, "media")}>`)}`;
}, "/c/Users/15034/Projects/ResaleCommand/node_modules/astro-seo/src/components/ExtendedTags.astro", void 0);

const $$Astro$4 = createAstro("https://example.com");
const $$TwitterTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$TwitterTags;
  const { card, site, title, creator, description, image, imageAlt } = Astro2.props.twitter;
  return renderTemplate`${card ? renderTemplate`<meta name="twitter:card"${addAttribute(card, "content")}>` : null}${site ? renderTemplate`<meta name="twitter:site"${addAttribute(site, "content")}>` : null}${title ? renderTemplate`<meta name="twitter:title"${addAttribute(title, "content")}>` : null}${image ? renderTemplate`<meta name="twitter:image"${addAttribute(image, "content")}>` : null}${imageAlt ? renderTemplate`<meta name="twitter:image:alt"${addAttribute(imageAlt, "content")}>` : null}${description ? renderTemplate`<meta name="twitter:description"${addAttribute(description, "content")}>` : null}${creator ? renderTemplate`<meta name="twitter:creator"${addAttribute(creator, "content")}>` : null}`;
}, "/c/Users/15034/Projects/ResaleCommand/node_modules/astro-seo/src/components/TwitterTags.astro", void 0);

const $$Astro$3 = createAstro("https://example.com");
const $$LanguageAlternatesTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$LanguageAlternatesTags;
  const { languageAlternates } = Astro2.props;
  return renderTemplate`${languageAlternates.map((alternate) => renderTemplate`<link rel="alternate"${addAttribute(alternate.hrefLang, "hreflang")}${addAttribute(alternate.href, "href")}>`)}`;
}, "/c/Users/15034/Projects/ResaleCommand/node_modules/astro-seo/src/components/LanguageAlternatesTags.astro", void 0);

const $$Astro$2 = createAstro("https://example.com");
const $$SEO = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$SEO;
  Astro2.props.surpressWarnings = true;
  function validateProps(props) {
    if (props.openGraph) {
      if (!props.openGraph.basic || (props.openGraph.basic.title ?? void 0) == void 0 || (props.openGraph.basic.type ?? void 0) == void 0 || (props.openGraph.basic.image ?? void 0) == void 0) {
        throw new Error(
          "If you pass the openGraph prop, you have to at least define the title, type, and image basic properties!"
        );
      }
    }
    if (props.title && props.openGraph?.basic.title) {
      if (props.title == props.openGraph.basic.title && !props.surpressWarnings) {
        console.warn(
          "WARNING(astro-seo): You passed the same value to `title` and `openGraph.optional.title`. This is most likely not what you want. See docs for more."
        );
      }
    }
    if (props.openGraph?.basic?.image && !props.openGraph?.image?.alt && !props.surpressWarnings) {
      console.warn(
        "WARNING(astro-seo): You defined `openGraph.basic.image`, but didn't define `openGraph.image.alt`. This is strongly discouraged.'"
      );
    }
  }
  validateProps(Astro2.props);
  let updatedTitle = "";
  if (Astro2.props.title) {
    updatedTitle = Astro2.props.title;
    if (Astro2.props.titleTemplate) {
      updatedTitle = Astro2.props.titleTemplate.replace(/%s/g, updatedTitle);
    }
  } else if (Astro2.props.titleDefault) {
    updatedTitle = Astro2.props.titleDefault;
  }
  const baseUrl = Astro2.site ?? Astro2.url;
  const defaultCanonicalUrl = new URL(Astro2.url.pathname + Astro2.url.search, baseUrl);
  return renderTemplate`${updatedTitle ? renderTemplate`<title>${unescapeHTML(updatedTitle)}</title>` : null}${Astro2.props.charset ? renderTemplate`<meta${addAttribute(Astro2.props.charset, "charset")}>` : null}<link rel="canonical"${addAttribute(Astro2.props.canonical || defaultCanonicalUrl.href, "href")}>${Astro2.props.description ? renderTemplate`<meta name="description"${addAttribute(Astro2.props.description, "content")}>` : null}<meta name="robots"${addAttribute(`${Astro2.props.noindex ? "noindex" : "index"}, ${Astro2.props.nofollow ? "nofollow" : "follow"}`, "content")}>${Astro2.props.openGraph && renderTemplate`${renderComponent($$result, "OpenGraphBasicTags", $$OpenGraphBasicTags, { ...Astro2.props })}`}${Astro2.props.openGraph?.optional && renderTemplate`${renderComponent($$result, "OpenGraphOptionalTags", $$OpenGraphOptionalTags, { ...Astro2.props })}`}${Astro2.props.openGraph?.image && renderTemplate`${renderComponent($$result, "OpenGraphImageTags", $$OpenGraphImageTags, { ...Astro2.props })}`}${Astro2.props.openGraph?.article && renderTemplate`${renderComponent($$result, "OpenGraphArticleTags", $$OpenGraphArticleTags, { ...Astro2.props })}`}${Astro2.props.twitter && renderTemplate`${renderComponent($$result, "TwitterTags", $$TwitterTags, { ...Astro2.props })}`}${Astro2.props.extend && renderTemplate`${renderComponent($$result, "ExtendedTags", $$ExtendedTags, { ...Astro2.props })}`}${Astro2.props.languageAlternates && renderTemplate`${renderComponent($$result, "LanguageAlternatesTags", $$LanguageAlternatesTags, { ...Astro2.props })}`}`;
}, "/c/Users/15034/Projects/ResaleCommand/node_modules/astro-seo/src/SEO.astro", void 0);

const $$Astro$1 = createAstro("https://example.com");
const $$SEOmeta = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$SEOmeta;
  const { title = "Change Me! ", description, image, canonical } = Astro2.props;
  const canonicalURL = canonical ?? new URL(Astro2.url.pathname, Astro2.site).toString();
  const resolvedImage = image ?? new URL("/opengraph.jpg", Astro2.site).toString();
  return renderTemplate`${renderComponent($$result, "SEO", $$SEO, { "title": title, "description": description ?? "Your company Default description", "canonical": canonicalURL, "twitter": {
    creator: "@mindstormdigital",
    site: "https://mindstorm.digital",
    card: "summary_large_image"
  }, "openGraph": {
    basic: {
      url: canonicalURL,
      type: "website",
      title,
      image: resolvedImage
    },
    image: {
      alt: title
    }
  } })}`;
}, "/c/Users/15034/Projects/ResaleCommand/src/components/SEOmeta.astro", void 0);

const $$Astro = createAstro("https://example.com");
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title = siteConfig.title, description, image } = Astro2.props;
  return renderTemplate`<html lang="en" data-theme="cupcake"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="shortcut icon" href="/favicon.ico"><link rel="sitemap" href="/sitemap-index.xml"><meta name="generator"${addAttribute(Astro2.generator, "content")}>${renderComponent($$result, "SEOmeta", $$SEOmeta, { "title": title, "description": description, "image": image })}${renderHead()}</head>  ${renderComponent($$result, "Navbar", Navbar, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@components/nav/Navbar.vue", "client:component-export": "default" })} <main> ${renderSlot($$result, $$slots["default"])} </main> ${renderComponent($$result, "Footer", $$Footer, {})} ${renderScript($$result, "/c/Users/15034/Projects/ResaleCommand/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts")} </html>`;
}, "/c/Users/15034/Projects/ResaleCommand/src/layouts/Layout.astro", void 0);

export { $$Layout as $, databases as d };
