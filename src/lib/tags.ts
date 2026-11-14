// Blog post tags. A post lists its tags in `tags:` in its front matter, and a story (`fiction: true`)
// also gets "Fiction" first. Each tag's address name (for /blog/?tag=...) and color come from here.
// A tag that isn't in `colors` still works and shows in gray.

type Post = { data: { tags: string[]; fiction: boolean } };

export function postTags(p: Post): string[] {
  return [...new Set([...(p.data.fiction ? ["Fiction"] : []), ...p.data.tags])];
}

export const tagSlug = (tag: string) => tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// The colors match the role tags on the Experience page.
const colors: Record<string, string> = {
  "ai-writing": "ai",
  research: "research",
  release: "teaching",
  "data-science": "industry",
};
export const tagClass = (tag: string) => {
  const slug = tagSlug(tag);
  if (slug === "fiction") return "post-tag fiction-tag";
  return colors[slug] ? `post-tag tag-${colors[slug]}` : "post-tag";
};

// Every tag in use, the most used first and then in alphabetical order.
export function allTags(posts: Post[]): string[] {
  const count = new Map<string, number>();
  posts.forEach((p) => postTags(p).forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)));
  return [...count.keys()].sort((a, b) => count.get(b)! - count.get(a)! || a.localeCompare(b));
}
