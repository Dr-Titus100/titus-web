import type { APIRoute } from "astro";

// Built at /robots.txt under the site's base path. On a custom domain (base "/") this is the
// domain's own robots.txt. Under github.io/titus-web/ crawlers read the domain root instead,
// so the Sitemap line there matters only once the site moves to its own domain.
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  const sitemap = new URL(`${base}sitemap-index.xml`, site).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
