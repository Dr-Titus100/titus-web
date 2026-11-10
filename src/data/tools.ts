import skills from "./skills.generated.json";

// The tools listed on the home page and the Tools page.
// Add a new skill or plugin here, and to skills.config.json if the site should pull its files.
export const tools = [
  {
    name: "titus-humanizer",
    kind: "Skill",
    blurb: "Rewrites text so it reads like a careful person wrote it, and scores AI-writing patterns from 0 to 1.",
    href: "/tools/titus-humanizer/",
    version: skills["titus-humanizer"].version,
    gradient: "linear-gradient(135deg,#0071e3,#a34dff,#ff4d6d)",
    links: [
      { label: "Checker", href: "/tools/titus-humanizer/checker/" },
      { label: "Rewrite", href: "/tools/titus-humanizer/rewrite/" },
      { label: "Any chatbot", href: "/tools/titus-humanizer/any-chatbot/" },
      { label: "Install", href: "/tools/titus-humanizer/install/" },
    ],
  },
];
