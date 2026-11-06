export interface HighlightGameInput {
  homeTeam: string;
  awayTeam: string;
  date: string;
  status: string;
}

/**
 * Generates a direct YouTube search URL for official NBA game highlights.
 * Returns null if the game is not yet completed/final.
 */
export function getYoutubeHighlightLink(game: HighlightGameInput): string | null {
  if (game.status !== "final") {
    return null;
  }

  // Format date to human-readable (e.g. "November 4, 2026")
  let formattedDate = game.date;
  try {
    const d = new Date(game.date);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  } catch {
    // Fall back to original date string
  }

  const query = encodeURIComponent(
    `${game.awayTeam} at ${game.homeTeam} Full Game Highlights NBA ${formattedDate}`
  );

  return `https://www.youtube.com/results?search_query=${query}`;
}
