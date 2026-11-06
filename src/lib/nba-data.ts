// ─────────────────────────────────────────────────────────────────────────────
// NBA Data Layer
//
// Static team registry stays here (colors, ESPN IDs, abbreviations).
// Mock game data has been removed — real data comes from /api/nba/* routes.
// ─────────────────────────────────────────────────────────────────────────────

export type GameStatus = "scheduled" | "live" | "final";

export interface NBATeam {
  /** Our internal slug (bos, lal, …) */
  id: string;
  /** ESPN numeric team id used in API calls */
  espnId: string;
  name: string;
  city: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
  /** Absolute URL to the ESPN team logo SVG */
  logoUrl: string;
  conference: "Eastern" | "Western";
}

export interface QuarterScore {
  /** Indexed 1-based: q[1], q[2], q[3], q[4], q[5] = OT */
  [quarter: number]: number;
}

export interface GameTeam {
  /** Our internal team id — may be "unknown" for teams not in our registry */
  id: string;
  espnId: string;
  name: string;
  abbreviation: string;
  logoUrl: string;
  score?: number;
  record?: string;
  quarters?: QuarterScore;
}

export interface Game {
  id: string;
  homeTeam: GameTeam;
  awayTeam: GameTeam;
  status: GameStatus;
  /** ISO 8601 date string */
  date: string;
  /** e.g. "7:30 PM ET" – present for scheduled games */
  time?: string;
  /** e.g. "Q3 4:12" or "Half" – present for live games */
  period?: string;
  arena?: string;
  broadcasts?: string[];
}

// ─── Article type (for news feed) ────────────────────────────────────────────

export interface NBAArticle {
  id: string;
  headline: string;
  description?: string;
  published: string;
  thumbnailUrl?: string;
  linkUrl?: string;
}

// ─── Community Post type (for community feed) ────────────────────────────────

export interface CommunityPost {
  id: string;
  source: "reddit" | "bluesky";
  author: string;
  handle: string;
  title?: string;
  content: string;
  likes: number;
  replies: number;
  url: string;
  createdAt: string;
}

// ─── Static Team Registry ─────────────────────────────────────────────────────
// ESPN numeric IDs: https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams

const ESPN_LOGO = (espnId: string) =>
  `https://a.espncdn.com/i/teamlogos/nba/500/${espnId}.png`;

export const NBA_TEAMS: NBATeam[] = [
  {
    id: "atl",
    espnId: "1",
    name: "Hawks",
    city: "Atlanta",
    abbreviation: "ATL",
    primaryColor: "#C1D32F",
    secondaryColor: "#E03A3E",
    logoUrl: ESPN_LOGO("atl"),
    conference: "Eastern",
  },
  {
    id: "bos",
    espnId: "2",
    name: "Celtics",
    city: "Boston",
    abbreviation: "BOS",
    primaryColor: "#007A33",
    secondaryColor: "#BA9653",
    logoUrl: ESPN_LOGO("bos"),
    conference: "Eastern",
  },
  {
    id: "bkn",
    espnId: "17",
    name: "Nets",
    city: "Brooklyn",
    abbreviation: "BKN",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    logoUrl: ESPN_LOGO("bkn"),
    conference: "Eastern",
  },
  {
    id: "cha",
    espnId: "30",
    name: "Hornets",
    city: "Charlotte",
    abbreviation: "CHA",
    primaryColor: "#1D1160",
    secondaryColor: "#00788C",
    logoUrl: ESPN_LOGO("cha"),
    conference: "Eastern",
  },
  {
    id: "chi",
    espnId: "4",
    name: "Bulls",
    city: "Chicago",
    abbreviation: "CHI",
    primaryColor: "#CE1141",
    secondaryColor: "#000000",
    logoUrl: ESPN_LOGO("chi"),
    conference: "Eastern",
  },
  {
    id: "cle",
    espnId: "5",
    name: "Cavaliers",
    city: "Cleveland",
    abbreviation: "CLE",
    primaryColor: "#860038",
    secondaryColor: "#FDBB30",
    logoUrl: ESPN_LOGO("cle"),
    conference: "Eastern",
  },
  {
    id: "dal",
    espnId: "6",
    name: "Mavericks",
    city: "Dallas",
    abbreviation: "DAL",
    primaryColor: "#00538C",
    secondaryColor: "#002B5E",
    logoUrl: ESPN_LOGO("dal"),
    conference: "Western",
  },
  {
    id: "den",
    espnId: "7",
    name: "Nuggets",
    city: "Denver",
    abbreviation: "DEN",
    primaryColor: "#0E2240",
    secondaryColor: "#FEC524",
    logoUrl: ESPN_LOGO("den"),
    conference: "Western",
  },
  {
    id: "det",
    espnId: "8",
    name: "Pistons",
    city: "Detroit",
    abbreviation: "DET",
    primaryColor: "#C8102E",
    secondaryColor: "#1D42BA",
    logoUrl: ESPN_LOGO("det"),
    conference: "Eastern",
  },
  {
    id: "gsw",
    espnId: "9",
    name: "Warriors",
    city: "Golden State",
    abbreviation: "GSW",
    primaryColor: "#1D428A",
    secondaryColor: "#FFC72C",
    logoUrl: ESPN_LOGO("gs"),
    conference: "Western",
  },
  {
    id: "hou",
    espnId: "10",
    name: "Rockets",
    city: "Houston",
    abbreviation: "HOU",
    primaryColor: "#CE1141",
    secondaryColor: "#000000",
    logoUrl: ESPN_LOGO("hou"),
    conference: "Western",
  },
  {
    id: "ind",
    espnId: "11",
    name: "Pacers",
    city: "Indiana",
    abbreviation: "IND",
    primaryColor: "#002D62",
    secondaryColor: "#FDBB30",
    logoUrl: ESPN_LOGO("ind"),
    conference: "Eastern",
  },
  {
    id: "lac",
    espnId: "12",
    name: "Clippers",
    city: "LA",
    abbreviation: "LAC",
    primaryColor: "#C8102E",
    secondaryColor: "#1D428A",
    logoUrl: ESPN_LOGO("lac"),
    conference: "Western",
  },
  {
    id: "lal",
    espnId: "13",
    name: "Lakers",
    city: "Los Angeles",
    abbreviation: "LAL",
    primaryColor: "#552583",
    secondaryColor: "#FDB927",
    logoUrl: ESPN_LOGO("lal"),
    conference: "Western",
  },
  {
    id: "mem",
    espnId: "29",
    name: "Grizzlies",
    city: "Memphis",
    abbreviation: "MEM",
    primaryColor: "#5D76A9",
    secondaryColor: "#12173F",
    logoUrl: ESPN_LOGO("mem"),
    conference: "Western",
  },
  {
    id: "mia",
    espnId: "14",
    name: "Heat",
    city: "Miami",
    abbreviation: "MIA",
    primaryColor: "#98002E",
    secondaryColor: "#F9A01B",
    logoUrl: ESPN_LOGO("mia"),
    conference: "Eastern",
  },
  {
    id: "mil",
    espnId: "15",
    name: "Bucks",
    city: "Milwaukee",
    abbreviation: "MIL",
    primaryColor: "#00471B",
    secondaryColor: "#EEE1C6",
    logoUrl: ESPN_LOGO("mil"),
    conference: "Eastern",
  },
  {
    id: "min",
    espnId: "16",
    name: "Timberwolves",
    city: "Minnesota",
    abbreviation: "MIN",
    primaryColor: "#0C2340",
    secondaryColor: "#236192",
    logoUrl: ESPN_LOGO("min"),
    conference: "Western",
  },
  {
    id: "nop",
    espnId: "3",
    name: "Pelicans",
    city: "New Orleans",
    abbreviation: "NOP",
    primaryColor: "#0C2340",
    secondaryColor: "#C8102E",
    logoUrl: ESPN_LOGO("no"),
    conference: "Western",
  },
  {
    id: "nyk",
    espnId: "18",
    name: "Knicks",
    city: "New York",
    abbreviation: "NYK",
    primaryColor: "#006BB6",
    secondaryColor: "#F58426",
    logoUrl: ESPN_LOGO("ny"),
    conference: "Eastern",
  },
  {
    id: "okc",
    espnId: "25",
    name: "Thunder",
    city: "Oklahoma City",
    abbreviation: "OKC",
    primaryColor: "#007AC1",
    secondaryColor: "#EF3B24",
    logoUrl: ESPN_LOGO("okc"),
    conference: "Western",
  },
  {
    id: "orl",
    espnId: "19",
    name: "Magic",
    city: "Orlando",
    abbreviation: "ORL",
    primaryColor: "#0077C0",
    secondaryColor: "#C4CED4",
    logoUrl: ESPN_LOGO("orl"),
    conference: "Eastern",
  },
  {
    id: "phi",
    espnId: "20",
    name: "76ers",
    city: "Philadelphia",
    abbreviation: "PHI",
    primaryColor: "#006BB6",
    secondaryColor: "#ED174C",
    logoUrl: ESPN_LOGO("phi"),
    conference: "Eastern",
  },
  {
    id: "phx",
    espnId: "21",
    name: "Suns",
    city: "Phoenix",
    abbreviation: "PHX",
    primaryColor: "#1D1160",
    secondaryColor: "#E56020",
    logoUrl: ESPN_LOGO("phx"),
    conference: "Western",
  },
  {
    id: "por",
    espnId: "22",
    name: "Trail Blazers",
    city: "Portland",
    abbreviation: "POR",
    primaryColor: "#E03A3E",
    secondaryColor: "#000000",
    logoUrl: ESPN_LOGO("por"),
    conference: "Western",
  },
  {
    id: "sac",
    espnId: "23",
    name: "Kings",
    city: "Sacramento",
    abbreviation: "SAC",
    primaryColor: "#5A2D81",
    secondaryColor: "#63727A",
    logoUrl: ESPN_LOGO("sac"),
    conference: "Western",
  },
  {
    id: "sas",
    espnId: "24",
    name: "Spurs",
    city: "San Antonio",
    abbreviation: "SAS",
    primaryColor: "#C4CED4",
    secondaryColor: "#000000",
    logoUrl: ESPN_LOGO("sa"),
    conference: "Western",
  },
  {
    id: "tor",
    espnId: "28",
    name: "Raptors",
    city: "Toronto",
    abbreviation: "TOR",
    primaryColor: "#CE1141",
    secondaryColor: "#000000",
    logoUrl: ESPN_LOGO("tor"),
    conference: "Eastern",
  },
  {
    id: "uta",
    espnId: "26",
    name: "Jazz",
    city: "Utah",
    abbreviation: "UTA",
    primaryColor: "#002B5C",
    secondaryColor: "#00471B",
    logoUrl: ESPN_LOGO("uta"),
    conference: "Western",
  },
  {
    id: "was",
    espnId: "27",
    name: "Wizards",
    city: "Washington",
    abbreviation: "WAS",
    primaryColor: "#002B5C",
    secondaryColor: "#E31837",
    logoUrl: ESPN_LOGO("was"),
    conference: "Eastern",
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/** Map espnId → NBATeam for fast lookups during API parsing */
const BY_ESPN_ID = new Map<string, NBATeam>(
  NBA_TEAMS.map((t) => [t.espnId, t])
);

/** Map internal id → NBATeam */
const BY_ID = new Map<string, NBATeam>(NBA_TEAMS.map((t) => [t.id, t]));

export function getAllTeams(): NBATeam[] {
  return NBA_TEAMS;
}

export function getTeamById(id: string): NBATeam | undefined {
  return BY_ID.get(id);
}

export function getTeamByEspnId(espnId: string): NBATeam | undefined {
  return BY_ESPN_ID.get(espnId);
}

/** Build a GameTeam from an ESPN competitor object, falling back gracefully */
export function buildGameTeam(
  espnId: string,
  score: number | undefined,
  record: string | undefined,
  quarters: QuarterScore | undefined,
  fallbackName: string,
  fallbackAbbr: string,
  fallbackLogo: string
): GameTeam {
  const known = BY_ESPN_ID.get(espnId);
  return {
    id: known?.id ?? "unknown",
    espnId,
    name: known?.name ?? fallbackName,
    abbreviation: known?.abbreviation ?? fallbackAbbr,
    logoUrl: known?.logoUrl ?? fallbackLogo,
    score,
    record,
    quarters,
  };
}

// ─── Utility helpers used by components ──────────────────────────────────────

export function isHomeGame(game: Game, teamId: string): boolean {
  return game.homeTeam.id === teamId;
}

export function getOpponentTeam(game: Game, teamId: string): GameTeam {
  return game.homeTeam.id === teamId ? game.awayTeam : game.homeTeam;
}

export function getMyTeamInGame(game: Game, teamId: string): GameTeam {
  return game.homeTeam.id === teamId ? game.homeTeam : game.awayTeam;
}
