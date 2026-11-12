import type { APIRoute } from "astro";
import { u } from "../lib/url";

// The web app manifest: the name and icons a phone uses when someone adds the site to a home screen.
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: "Titus Nyarko Nde",
      short_name: "Titus",
      start_url: u("/"),
      scope: u("/"),
      display: "browser",
      background_color: "#ffffff",
      theme_color: "#ffffff",
      icons: [
        { src: u("/icon-192.png"), sizes: "192x192", type: "image/png" },
        { src: u("/icon-512.png"), sizes: "512x512", type: "image/png" },
      ],
    }, null, 2),
    { headers: { "Content-Type": "application/manifest+json" } },
  );
