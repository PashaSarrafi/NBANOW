export interface StreamOption {
  name: string;
  platform: string;
  url: string;
  badgeColor: string; // Tailwind color classes e.g. 'bg-red-500/20 text-red-400 border-red-500/30'
  type: "National" | "Regional" | "League Pass";
}

interface KnownNetwork {
  platform: string;
  url: string;
  badgeColor: string;
  type: "National" | "Regional" | "League Pass";
}

const KNOWN_NETWORKS: Record<string, KnownNetwork> = {
  ESPN: {
    platform: "ESPN / WatchESPN",
    url: "https://www.espn.com/watch/",
    badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
    type: "National",
  },
  ESPN2: {
    platform: "ESPN2 / WatchESPN",
    url: "https://www.espn.com/watch/",
    badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
    type: "National",
  },
  ABC: {
    platform: "ABC / ESPN3",
    url: "https://www.espn.com/watch/",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    type: "National",
  },
  TNT: {
    platform: "Max / TNT",
    url: "https://www.max.com/",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    type: "National",
  },
  TBS: {
    platform: "Max / TBS",
    url: "https://www.max.com/",
    badgeColor: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    type: "National",
  },
  "NBA TV": {
    platform: "NBA App / Web",
    url: "https://www.nba.com/watch/nba-tv",
    badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    type: "National",
  },
  NBATV: {
    platform: "NBA App / Web",
    url: "https://www.nba.com/watch/nba-tv",
    badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    type: "National",
  },
  "LEAGUE PASS": {
    platform: "NBA League Pass",
    url: "https://www.nba.com/leaguepass",
    badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    type: "League Pass",
  },
  "NBA LEAGUE PASS": {
    platform: "NBA League Pass",
    url: "https://www.nba.com/leaguepass",
    badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    type: "League Pass",
  },
};

/**
 * Returns available streaming destinations and provider links for an NBA game.
 * If the game is already final/completed, returns an empty list.
 */
export function getStreamingLinks(
  broadcasts: string[] = [],
  isCompleted: boolean = false
): StreamOption[] {
  if (isCompleted) {
    return [];
  }

  // Deduplicate broadcast names
  const cleanNames = Array.from(
    new Set(broadcasts.map((b) => b.trim()).filter(Boolean))
  );

  const results: StreamOption[] = [];
  let hasNational = false;

  for (const name of cleanNames) {
    const upper = name.toUpperCase();
    const known = KNOWN_NETWORKS[upper];

    if (known) {
      if (known.type === "National") hasNational = true;
      results.push({
        name,
        platform: known.platform,
        url: known.url,
        badgeColor: known.badgeColor,
        type: known.type,
      });
    } else {
      // Regional or local RSN broadcast
      results.push({
        name,
        platform: "Regional Sports Network",
        url: "https://www.nba.com/watch",
        badgeColor: "bg-zinc-800/80 text-zinc-300 border-zinc-700/60",
        type: "Regional",
      });
    }
  }

  // If no national broadcast is scheduled or no broadcasts were parsed,
  // NBA League Pass covers out-of-market viewing.
  const hasLeaguePass = results.some((r) => r.type === "League Pass");
  if (!hasLeaguePass && (!hasNational || results.length === 0)) {
    results.push({
      name: "NBA League Pass",
      platform: "NBA App / Web",
      url: "https://www.nba.com/leaguepass",
      badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      type: "League Pass",
    });
  }

  return results;
}
