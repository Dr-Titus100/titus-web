// Builds a link that works under the site's base path (for example /titus-web/).
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
export const u = (path: string) => base + (path.startsWith("/") ? path : "/" + path);
