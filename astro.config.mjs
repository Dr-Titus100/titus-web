import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// The site is served from https://dr-titus100.github.io/titus-web/ by default.
// With a custom domain, set SITE_URL to the domain and SITE_BASE to "/".
const site = process.env.SITE_URL || "https://dr-titus100.github.io";
const base = process.env.SITE_BASE ?? "/titus-web";

export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  integrations: [sitemap()],
});
