// Route: GET /api/nba/scoreboard
//
// Proxies ESPN's public scoreboard endpoint and maps it to our Game interface.
// ESPN endpoint: https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard

import { buildGameTeam, type Game, type QuarterScore } from "@/lib/nba-data";

const ESPN_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

export interface ScoreboardResponse {
  games: Game[];
  lastUpdated: string;
}

// ─── ESPN shape (partial — only the fields we consume) ───────────────────────

interface EspnLinescoreItem {
  value?: number;
}

interface EspnScoreObject {
  value?: number;
  displayValue?: string;
}

interface EspnCompetitor {
  id: string;
  score?: string | number | EspnScoreObject;
  homeAway: "home" | "away";
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo?: string;
  };
  records?: Array<{ summary: string; type: string }>;
  linescores?: EspnLinescoreItem[];
}

interface EspnStatusType {
  id: string; // "1" pre, "2" in-progress, "3" post
  state?: "pre" | "in" | "post";
  completed: boolean;
  description: string;
}

interface EspnStatus {
  type: EspnStatusType;
  period?: number;
  displayClock?: string;
}

interface EspnVenue {
  fullName?: string;
  address?: { city?: string; state?: string };
}

interface EspnBroadcast {
  names?: string[];
}

interface EspnNote {
  headline?: string;
}

interface EspnCompetition {
  id: string;
  date: string;
  status: EspnStatus;
  competitors: EspnCompetitor[];
  venue?: EspnVenue;
  broadcasts?: EspnBroadcast[];
  notes?: EspnNote[];
}

interface EspnEvent {
  id: string;
  date: string;
  competitions: EspnCompetition[];
}

interface EspnScoreboardPayload {
  events?: EspnEvent[];
}

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapStatusType(
  statusType: EspnStatusType
): Game["status"] {
  if (statusType.completed || statusType.state === "post" || statusType.id === "3") {
    return "final";
  }
  if (statusType.state === "in" || statusType.id === "2") {
    return "live";
  }
  return "scheduled";
}

function parseScore(rawScore: unknown, gameStatus: Game["status"]): number | undefined {
  if (gameStatus === "scheduled") {
    return undefined;
  }
  if (rawScore === null || rawScore === undefined) {
    return undefined;
  }
  if (typeof rawScore === "number") {
    return isNaN(rawScore) ? undefined : rawScore;
  }
  if (typeof rawScore === "string") {
    const parsed = parseInt(rawScore, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  if (typeof rawScore === "object") {
    const obj = rawScore as { value?: number; displayValue?: string };
    if (typeof obj.value === "number" && !isNaN(obj.value)) {
      return obj.value;
    }
    if (typeof obj.displayValue === "string") {
      const parsed = parseInt(obj.displayValue, 10);
      return isNaN(parsed) ? undefined : parsed;
    }
  }
  return undefined;
}

function mapPeriod(status: EspnStatus): string | undefined {
  if (!status.period) return undefined;
  const p = status.period;
  const clock = status.displayClock ?? "";
  if (p > 4) return `OT${p > 5 ? p - 4 : ""} ${clock}`.trim();
  return `Q${p} ${clock}`.trim();
}

function mapQuarters(linescores?: EspnLinescoreItem[]): QuarterScore | undefined {
  if (!linescores || linescores.length === 0) return undefined;
  const result: QuarterScore = {};
  linescores.forEach((ls, i) => {
    if (typeof ls.value === "number") {
      result[i + 1] = ls.value;
    }
  });
  return Object.keys(result).length > 0 ? result : undefined;
}

function mapTime(date: string, gameStatus: Game["status"]): string | undefined {
  if (gameStatus !== "scheduled") return undefined;
  try {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
      hour12: true,
    }) + " ET";
  } catch {
    return undefined;
  }
}

function mapCompetition(competition: EspnCompetition): Game | null {
  const { competitors, status, date, venue } = competition;
  if (!competitors || competitors.length < 2) return null;

  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const gameStatus = mapStatusType(status.type);

  const homeRecord = home.records?.find((r) => r.type === "total")?.summary;
  const awayRecord = away.records?.find((r) => r.type === "total")?.summary;

  const homeScore = parseScore(home.score, gameStatus);
  const awayScore = parseScore(away.score, gameStatus);

  const homeTeam = buildGameTeam(
    home.team.id,
    homeScore,
    homeRecord,
    mapQuarters(home.linescores),
    home.team.displayName,
    home.team.abbreviation,
    home.team.logo ?? ""
  );

  const awayTeam = buildGameTeam(
    away.team.id,
    awayScore,
    awayRecord,
    mapQuarters(away.linescores),
    away.team.displayName,
    away.team.abbreviation,
    away.team.logo ?? ""
  );

  const arenaName = venue?.fullName;
  const arenaCity = venue?.address?.city;
  const arena = arenaName
    ? arenaCity
      ? `${arenaName}, ${arenaCity}`
      : arenaName
    : undefined;

  const broadcastsArr: string[] = competition.broadcasts?.flatMap((b: EspnBroadcast) => b.names || []) || [];

  return {
    id: competition.id,
    homeTeam,
    awayTeam,
    status: gameStatus,
    date,
    time: mapTime(date, gameStatus),
    period: gameStatus === "live" ? mapPeriod(status) : undefined,
    arena,
    broadcasts: broadcastsArr,
  };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const dates = searchParams.get("dates");
    const endpoint = dates
      ? `${ESPN_SCOREBOARD}?dates=${encodeURIComponent(dates)}`
      : ESPN_SCOREBOARD;

    const res = await fetch(endpoint, {
      next: { revalidate: 30 },
      headers: { "User-Agent": "NBANOW/1.0" },
    });

    if (!res.ok) {
      return Response.json(
        { error: `ESPN returned ${res.status}` },
        { status: 502 }
      );
    }

    const payload: EspnScoreboardPayload = await res.json();
    const events = payload.events ?? [];

    const games: Game[] = events
      .flatMap((event) =>
        event.competitions.map((comp) => mapCompetition(comp))
      )
      .filter((g): g is Game => g !== null);

    const body: ScoreboardResponse = {
      games,
      lastUpdated: new Date().toISOString(),
    };

    return Response.json(body);
  } catch (err) {
    console.error("[/api/nba/scoreboard]", err);
    return Response.json({ error: "Failed to fetch scoreboard" }, { status: 500 });
  }
}
