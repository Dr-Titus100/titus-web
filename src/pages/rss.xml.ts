import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { u } from "../lib/url";
import { postTags } from "../lib/tags";

// The blog's RSS feed, newest post first. Drafts are left out.
export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection("blog", (p) => !p.data.draft)).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return rss({
    title: "Titus Nyarko Nde: Blog",
    description: "Stories and notes by Titus Nyarko Nde.",
    site: new URL(u("/"), site).href,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: u(`/blog/${p.id}/`),
      categories: postTags(p),
    })),
    customData: "<language>en-us</language>",
  });
};
