import 'piccolore';
import { q as decodeKey } from './chunks/astro/server_DnVpOiel.mjs';
import 'clsx';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_BowB-cus.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///c/Users/15034/Projects/ResaleCommand/","cacheDir":"file:///c/Users/15034/Projects/ResaleCommand/node_modules/.astro/","outDir":"file:///c/Users/15034/Projects/ResaleCommand/dist/","srcDir":"file:///c/Users/15034/Projects/ResaleCommand/src/","publicDir":"file:///c/Users/15034/Projects/ResaleCommand/public/","buildClientDir":"file:///c/Users/15034/Projects/ResaleCommand/dist/client/","buildServerDir":"file:///c/Users/15034/Projects/ResaleCommand/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[{"type":"external","src":"/_astro/daisyui.CjZY9FJS.css"}],"routeData":{"route":"/404","isIndex":false,"type":"page","pattern":"^\\/404$","segments":[[{"content":"404","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/404.astro","pathname":"/404","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[],"routeData":{"route":"/api/generate-description","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/generate-description$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"generate-description","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/generate-description.ts","pathname":"/api/generate-description","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[],"routeData":{"route":"/api/identify-item","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/identify-item$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"identify-item","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/identify-item.ts","pathname":"/api/identify-item","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[{"type":"external","src":"/_astro/daisyui.CjZY9FJS.css"}],"routeData":{"route":"/daisyui","isIndex":false,"type":"page","pattern":"^\\/daisyui$","segments":[[{"content":"daisyui","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/daisyui.astro","pathname":"/daisyui","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[{"type":"external","src":"/_astro/daisyui.CjZY9FJS.css"}],"routeData":{"route":"/dashboard","isIndex":false,"type":"page","pattern":"^\\/dashboard$","segments":[[{"content":"dashboard","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/dashboard.astro","pathname":"/dashboard","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[{"type":"external","src":"/_astro/daisyui.CjZY9FJS.css"}],"routeData":{"route":"/dataprotection","isIndex":false,"type":"page","pattern":"^\\/dataprotection$","segments":[[{"content":"dataprotection","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/dataprotection.astro","pathname":"/dataprotection","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[{"type":"external","src":"/_astro/daisyui.CjZY9FJS.css"}],"routeData":{"route":"/imprint","isIndex":false,"type":"page","pattern":"^\\/imprint$","segments":[[{"content":"imprint","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/imprint.astro","pathname":"/imprint","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[{"type":"external","src":"/_astro/daisyui.CjZY9FJS.css"}],"routeData":{"route":"/inventory","isIndex":false,"type":"page","pattern":"^\\/inventory$","segments":[[{"content":"inventory","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/inventory.astro","pathname":"/inventory","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[{"type":"external","src":"/_astro/daisyui.CjZY9FJS.css"}],"routeData":{"route":"/join","isIndex":false,"type":"page","pattern":"^\\/join$","segments":[[{"content":"join","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/join.astro","pathname":"/join","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[{"type":"external","src":"/_astro/daisyui.CjZY9FJS.css"}],"routeData":{"route":"/login","isIndex":false,"type":"page","pattern":"^\\/login$","segments":[[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/login.astro","pathname":"/login","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[{"type":"external","src":"/_astro/daisyui.CjZY9FJS.css"}],"routeData":{"route":"/logout","isIndex":false,"type":"page","pattern":"^\\/logout$","segments":[[{"content":"logout","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/logout.astro","pathname":"/logout","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[{"type":"external","src":"/_astro/daisyui.CjZY9FJS.css"}],"routeData":{"route":"/scan","isIndex":false,"type":"page","pattern":"^\\/scan$","segments":[[{"content":"scan","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/scan.astro","pathname":"/scan","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[{"type":"external","src":"/_astro/daisyui.CjZY9FJS.css"}],"routeData":{"route":"/signup","isIndex":false,"type":"page","pattern":"^\\/signup$","segments":[[{"content":"signup","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/signup.astro","pathname":"/signup","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C2J1FJ8k.js"}],"styles":[{"type":"external","src":"/_astro/daisyui.CjZY9FJS.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"never"}}}],"site":"https://example.com","base":"/","trailingSlash":"never","compressHTML":true,"componentMetadata":[["/c/Users/15034/Projects/ResaleCommand/src/pages/404.astro",{"propagation":"none","containsHead":true}],["/c/Users/15034/Projects/ResaleCommand/src/pages/daisyui.astro",{"propagation":"none","containsHead":true}],["/c/Users/15034/Projects/ResaleCommand/src/pages/dashboard.astro",{"propagation":"none","containsHead":true}],["/c/Users/15034/Projects/ResaleCommand/src/pages/dataprotection.astro",{"propagation":"none","containsHead":true}],["/c/Users/15034/Projects/ResaleCommand/src/pages/imprint.astro",{"propagation":"none","containsHead":true}],["/c/Users/15034/Projects/ResaleCommand/src/pages/index.astro",{"propagation":"none","containsHead":true}],["/c/Users/15034/Projects/ResaleCommand/src/pages/inventory.astro",{"propagation":"none","containsHead":true}],["/c/Users/15034/Projects/ResaleCommand/src/pages/join.astro",{"propagation":"none","containsHead":true}],["/c/Users/15034/Projects/ResaleCommand/src/pages/login.astro",{"propagation":"none","containsHead":true}],["/c/Users/15034/Projects/ResaleCommand/src/pages/logout.astro",{"propagation":"none","containsHead":true}],["/c/Users/15034/Projects/ResaleCommand/src/pages/scan.astro",{"propagation":"none","containsHead":true}],["/c/Users/15034/Projects/ResaleCommand/src/pages/signup.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/404@_@astro":"pages/404.astro.mjs","\u0000@astro-page:src/pages/api/generate-description@_@ts":"pages/api/generate-description.astro.mjs","\u0000@astro-page:src/pages/api/identify-item@_@ts":"pages/api/identify-item.astro.mjs","\u0000@astro-page:src/pages/daisyui@_@astro":"pages/daisyui.astro.mjs","\u0000@astro-page:src/pages/dashboard@_@astro":"pages/dashboard.astro.mjs","\u0000@astro-page:src/pages/dataprotection@_@astro":"pages/dataprotection.astro.mjs","\u0000@astro-page:src/pages/imprint@_@astro":"pages/imprint.astro.mjs","\u0000@astro-page:src/pages/inventory@_@astro":"pages/inventory.astro.mjs","\u0000@astro-page:src/pages/join@_@astro":"pages/join.astro.mjs","\u0000@astro-page:src/pages/login@_@astro":"pages/login.astro.mjs","\u0000@astro-page:src/pages/logout@_@astro":"pages/logout.astro.mjs","\u0000@astro-page:src/pages/scan@_@astro":"pages/scan.astro.mjs","\u0000@astro-page:src/pages/signup@_@astro":"pages/signup.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_B0fI5sDV.mjs","/c/Users/15034/Projects/ResaleCommand/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_D5y47hC0.mjs","@components/nav/Navbar.vue":"_astro/Navbar.DqrmgbCO.js","@astrojs/vue/client.js":"_astro/client.CMhj74Mi.js","/c/Users/15034/Projects/ResaleCommand/src/pages/join.astro?astro&type=script&index=0&lang.ts":"_astro/join.astro_astro_type_script_index_0_lang.CriomtJs.js","/c/Users/15034/Projects/ResaleCommand/src/pages/login.astro?astro&type=script&index=0&lang.ts":"_astro/login.astro_astro_type_script_index_0_lang.DJEpP1w8.js","/c/Users/15034/Projects/ResaleCommand/src/pages/logout.astro?astro&type=script&index=0&lang.ts":"_astro/logout.astro_astro_type_script_index_0_lang.9MpLgtuL.js","/c/Users/15034/Projects/ResaleCommand/src/pages/signup.astro?astro&type=script&index=0&lang.ts":"_astro/signup.astro_astro_type_script_index_0_lang.cHMLcNU3.js","/c/Users/15034/Projects/ResaleCommand/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts":"_astro/Layout.astro_astro_type_script_index_0_lang.DgMpHGqX.js","/c/Users/15034/Projects/ResaleCommand/src/components/InventoryList.astro?astro&type=script&index=0&lang.ts":"_astro/InventoryList.astro_astro_type_script_index_0_lang.DRwV2WVr.js","/c/Users/15034/Projects/ResaleCommand/src/components/CameraCapture.astro?astro&type=script&index=0&lang.ts":"_astro/CameraCapture.astro_astro_type_script_index_0_lang.BadR_hKd.js","astro:scripts/page.js":"_astro/page.C2J1FJ8k.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/daisyui.CjZY9FJS.css","/android-chrome-192x192.png","/android-chrome-512x512.png","/apple-touch-icon.png","/favicon-16x16.png","/favicon-32x32.png","/favicon.ico","/favicon.svg","/robots.txt","/site.webmanifest","/_astro/CameraCapture.astro_astro_type_script_index_0_lang.BadR_hKd.js","/_astro/InventoryList.astro_astro_type_script_index_0_lang.DRwV2WVr.js","/_astro/Layout.astro_astro_type_script_index_0_lang.DgMpHGqX.js","/_astro/Navbar.DqrmgbCO.js","/_astro/appwrite.Cu45kNVr.js","/_astro/auth.DG5h8cRj.js","/_astro/client.CMhj74Mi.js","/_astro/inventory.0Q6N9gdl.js","/_astro/join.astro_astro_type_script_index_0_lang.CriomtJs.js","/_astro/login.astro_astro_type_script_index_0_lang.DJEpP1w8.js","/_astro/logout.astro_astro_type_script_index_0_lang.9MpLgtuL.js","/_astro/module.esm.BaMlba_H.js","/_astro/page.C2J1FJ8k.js","/_astro/runtime-core.esm-bundler.BrNsztqg.js","/_astro/runtime-dom.esm-bundler.STX-4lLy.js","/_astro/signup.astro_astro_type_script_index_0_lang.cHMLcNU3.js","/_astro/store.D_n1941p.js","/_astro/useAuth.DooR_B9j.js","/_astro/page.C2J1FJ8k.js"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"serverIslandNameMap":[],"key":"5W844N262TN+yrUtJmBeEpt1e9XwFPDHJWsay3tLGQs="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
