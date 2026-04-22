import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  const protectedRoutes = ["/dashboard", "/inventory", "/partners"];
  const url = new URL(context.request.url);

  // Check if current path requires protection
  // Using startsWith to cover sub-routes e.g. /inventory/item/123
  if (protectedRoutes.some(route => url.pathname.startsWith(route))) {
    const authCookie = context.cookies.get("auth_session_indicator");
    
    // If cookie is missing or invalid, redirect to login
    if (!authCookie || !authCookie.value) {
      return context.redirect("/login", 302);
    }
  }

  return next();
});
