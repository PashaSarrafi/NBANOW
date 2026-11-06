// Route: GET /api/nba/news
//
// Proxies ESPN's NBA news endpoint and returns a clean article list.
// ESPN endpoint: https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news

import { type NBAArticle } from "@/lib/nba-data";

const ESPN_NEWS =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news";

export interface NewsResponse {
  articles: NBAArticle[];
  lastUpdated: string;
}

// ─── ESPN shape (partial) ─────────────────────────────────────────────────────

interface EspnImage {
  url?: string;
  href?: string;
}

interface EspnLink {
  href?: string;
  rel?: string[];
}

interface EspnArticle {
  id?: number | string;
  headline?: string;
  description?: string;
  published?: string;
  images?: EspnImage[];
  links?: {
    web?: { href?: string };
    mobile?: { href?: string };
    app?: { href?: string };
  } | EspnLink[];
}

interface EspnNewsPayload {
  articles?: EspnArticle[];
}

// ─── Mapper ──────────────────────────────────────────────────────────────────

function extractWebLink(links: EspnArticle["links"]): string | undefined {
  if (!links) return undefined;
  if (Array.isArray(links)) {
    const webLink = links.find((l) => l.rel?.includes("web"));
    return webLink?.href;
  }
  return (links as { web?: { href?: string } }).web?.href;
}

function mapArticle(raw: EspnArticle, index: number): NBAArticle {
  const thumbnail =
    raw.images?.find((img) => img.url || img.href)?.url ||
    raw.images?.find((img) => img.url || img.href)?.href;

  return {
    id: String(raw.id ?? index),
    headline: raw.headline ?? "NBA Update",
    description: raw.description,
    published: raw.published ?? new Date().toISOString(),
    thumbnailUrl: thumbnail,
    linkUrl: extractWebLink(raw.links),
  };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(): Promise<Response> {
  try {
    const res = await fetch(ESPN_NEWS, {
      next: { revalidate: 300 }, // news refreshes every 5 minutes
      headers: { "User-Agent": "NBANOW/1.0" },
    });

    if (!res.ok) {
      return Response.json(
        { error: `ESPN returned ${res.status}` },
        { status: 502 }
      );
    }

    const payload: EspnNewsPayload = await res.json();
    const articles: NBAArticle[] = (payload.articles ?? []).map(mapArticle);

    const body: NewsResponse = {
      articles,
      lastUpdated: new Date().toISOString(),
    };

    return Response.json(body);
  } catch (err) {
    console.error("[/api/nba/news]", err);
    return Response.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
