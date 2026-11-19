// Shared details for the Sankofa Snake pages: the About, Play game and How to play tabs.
import games from "./games.generated.json";

export const game = games["sankofa-snake"];
export const version = game.version.replace(/^v/, "");

// The levels and ways to play a reviewer can name as a favorite. The ids must match FAVORITES in worker/index.js.
export const favorites = [
  { id: "farm", label: "Level 1, Farm" },
  { id: "park", label: "Level 2, Park" },
  { id: "market", label: "Level 3, Market" },
  { id: "city", label: "Level 4, City" },
  { id: "road", label: "Level 5, Road" },
  { id: "lab", label: "Level 6, Lab" },
  { id: "maze", label: "Level 7, Maze" },
  { id: "ocean", label: "Level 8, Ocean" },
  { id: "village", label: "Level 9, Weaving village" },
  { id: "daily", label: "Daily challenge" },
  { id: "free", label: "Free play" },
  { id: "practice", label: "Practice" },
];
