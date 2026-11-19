import skills from "./skills.generated.json";
import games from "./games.generated.json";

// The tools listed on the Tools page.
// Add a new skill or plugin here, and to skills.config.json if the site should pull its files.
// A game goes in games.config.json instead.
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
    cta: "Try the Checker",
    more: { label: "Learn more", href: "/tools/titus-humanizer/" },
    image: {
      webp: "/images/checker-light.webp",
      jpg: "/images/checker-light.jpg",
      alt: "The titus-humanizer Checker scoring a sample email 0.80, high, with each AI-writing pattern highlighted",
      width: 1152,
      height: 770,
    },
  },
  {
    name: "Sankofa Snake",
    kind: "Game",
    blurb: "A snake game in kente colors. You steer a snake of woven kente blocks to collect cowrie shells, and each level adds a new world and one new rule.",
    href: "/games/sankofa-snake/",
    version: games["sankofa-snake"].version,
    gradient: "linear-gradient(135deg,#f2b705,#1e8a3e,#c8102e)",
    links: [{ label: "Game", href: "/games/sankofa-snake/" }],
    cta: "Play the game",
    more: { label: "See the code", href: games["sankofa-snake"].repoUrl },
    image: {
      webp: "/images/sankofa-snake.webp",
      jpg: "/images/sankofa-snake.jpg",
      alt: "Sankofa Snake in the Market level: a snake of woven kente blocks winds between market stalls toward a cowrie shell",
      width: 1152,
      height: 770,
    },
  },
];
