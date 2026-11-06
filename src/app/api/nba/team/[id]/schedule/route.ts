// Route: GET /api/nba/team/[id]/schedule
//
// [id] = our internal team slug (e.g. "bos", "lal"). We look up the ESPN numeric
// id from the registry, then proxy ESPN's schedule endpoint.
//
// ESPN endpoint:
//   https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{espnId}/schedule

import type { NextRequest } from "next/server";
import {
  getTeamById,
  buildGameTeam,
  type Game,
  type QuarterScore,
} from "@/lib/nba-data";

const ESPN_SCHEDULE = (espnId: string) =>
  `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espnId}/schedule`;

export interface TeamScheduleResponse {
  teamId: string;
  games: Game[];
  lastUpdated: string;
}

// ─── ESPN schedule shape (partial) ───────────────────────────────────────────

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
    logos?: Array<{ href: string }>;
  };
  records?: Array<{ summary: string; type: string }>;
  linescores?: EspnLinescoreItem[];
}

interface EspnStatusType {
  id: string; // "1" pre, "2" in-progress, "3" post
  state?: "pre" | "in" | "post";
  completed: boolean;
}

interface EspnStatusDetail {
  type: EspnStatusType;
  period?: number;
  displayClock?: string;
}

interface EspnVenue {
  fullName?: string;
  address?: { city?: string };
}

interface EspnBroadcast {
  names?: string[];
}

interface EspnCompetition {
  id: string;
  date: string;
  status: EspnStatusDetail;
  competitors: EspnCompetitor[];
  venue?: EspnVenue;
  broadcasts?: EspnBroadcast[];
}

interface EspnEvent {
  id: string;
  date: string;
  competitions: EspnCompetition[];
}

interface EspnSchedulePayload {
  events?: EspnEvent[];
}

// ─── Mapper helpers ───────────────────────────────────────────────────────────

function mapStatus(statusType: EspnStatusType): Game["status"] {
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

function mapPeriod(status: EspnStatusDetail): string | undefined {
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

function formatTime(isoDate: string): string | undefined {
  try {
    return (
      new Date(isoDate).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York",
        hour12: true,
      }) + " ET"
    );
  } catch {
    return undefined;
  }
}

function mapEvent(event: EspnEvent): Game | null {
  const comp = event.competitions[0];
  if (!comp) return null;

  const { competitors, status, date, venue } = comp;
  if (!competitors || competitors.length < 2) return null;

  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const gameStatus = mapStatus(status.type);

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
    home.team.logos?.[0]?.href ?? ""
  );

  const awayTeam = buildGameTeam(
    away.team.id,
    awayScore,
    awayRecord,
    mapQuarters(away.linescores),
    away.team.displayName,
    away.team.abbreviation,
    away.team.logos?.[0]?.href ?? ""
  );

  const arenaName = venue?.fullName;
  const arenaCity = venue?.address?.city;
  const arena = arenaName
    ? arenaCity
      ? `${arenaName}, ${arenaCity}`
      : arenaName
    : undefined;

  const broadcastsArr: string[] = comp.broadcasts?.flatMap((b: EspnBroadcast) => b.names || []) || [];

  return {
    id: comp.id,
    homeTeam,
    awayTeam,
    status: gameStatus,
    date,
    time: gameStatus === "scheduled" ? formatTime(date) : undefined,
    period: gameStatus === "live" ? mapPeriod(status) : undefined,
    arena,
    broadcasts: broadcastsArr,
  };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/nba/team/[id]/schedule">
) {
  const { id } = await ctx.params;

  const team = getTeamById(id);
  if (!team) {
    return Response.json({ error: `Unknown team id: ${id}` }, { status: 404 });
  }

  try {
    const res = await fetch(ESPN_SCHEDULE(team.espnId), {
      next: { revalidate: 60 },
      headers: { "User-Agent": "NBANOW/1.0" },
    });

    if (!res.ok) {
      return Response.json(
        { error: `ESPN returned ${res.status}` },
        { status: 502 }
      );
    }

    const payload: EspnSchedulePayload = await res.json();
    const games: Game[] = (payload.events ?? [])
      .map(mapEvent)
      .filter((g): g is Game => g !== null);

    const body: TeamScheduleResponse = {
      teamId: id,
      games,
      lastUpdated: new Date().toISOString(),
    };

    return Response.json(body);
  } catch (err) {
    console.error(`[/api/nba/team/${id}/schedule]`, err);
    return Response.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}
