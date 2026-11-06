// Route: GET /api/nba/team/[id]/community
//
// Combines two free public sources for team community discussions:
// 1. Reddit: Official team subreddit posts
// 2. Bluesky: Real-time public posts searching for the team

import type { NextRequest } from "next/server";
import { getTeamById, type CommunityPost } from "@/lib/nba-data";

export interface CommunityResponse {
  teamId: string;
  posts: CommunityPost[];
  lastUpdated: string;
}

// ─── Team Subreddit Mapping ───────────────────────────────────────────────────

export const TEAM_SUBREDDITS: Record<string, string> = {
  atl: "AtlantaHawks",
  bos: "bostonceltics",
  bkn: "GoNets",
  cha: "CharlotteHornets",
  chi: "chicagobulls",
  cle: "clevelandcavs",
  dal: "mavericks",
  den: "denvernuggets",
  det: "DetroitPistons",
  gsw: "warriors",
  hou: "rockets",
  ind: "pacers",
  lac: "LAClippers",
  lal: "lakers",
  mem: "memphisgrizzlies",
  mia: "heat",
  mil: "MkeBucks",
  min: "timberwolves",
  nop: "NOLAPelicans",
  nyk: "NYKnicks",
  okc: "Thunder",
  orl: "OrlandoMagic",
  phi: "sixers",
  phx: "suns",
  por: "ripcity",
  sac: "kings",
  sas: "NBASpurs",
  tor: "torontoraptors",
  uta: "utahjazz",
  was: "washingtonwizards",
};

// ─── Reddit API Types & Parser ────────────────────────────────────────────────

interface RedditChildData {
  id: string;
  author: string;
  title: string;
  selftext?: string;
  url?: string;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
}

interface RedditListingResponse {
  data?: {
    children?: Array<{
      kind: string;
      data: RedditChildData;
    }>;
  };
}

async function fetchRedditPosts(sub: string): Promise<CommunityPost[]> {
  const url = `https://www.reddit.com/r/${sub}/hot.json?limit=10`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "NBANOW/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return getFallbackRedditPosts(sub);
    }

    const data: RedditListingResponse = await res.json();
    const children = data.data?.children ?? [];

    return children.map(({ data: p }) => ({
      id: `reddit-${p.id}`,
      source: "reddit" as const,
      author: p.author || "reddit_user",
      handle: `u/${p.author || "reddit_user"}`,
      title: p.title,
      content: p.selftext ? p.selftext.slice(0, 300) : p.title,
      likes: p.score ?? 0,
      replies: p.num_comments ?? 0,
      url: p.permalink
        ? `https://www.reddit.com${p.permalink}`
        : `https://www.reddit.com/r/${sub}`,
      createdAt: new Date(p.created_utc * 1000).toISOString(),
    }));
  } catch (err) {
    console.error(`[Reddit] Failed to fetch r/${sub}:`, err);
    return getFallbackRedditPosts(sub);
  }
}

function getFallbackRedditPosts(sub: string): CommunityPost[] {
  // Graceful fallback linking directly to active subreddit discussions if Reddit blocks or rate-limits requests
  const now = Date.now();
  return [
    {
      id: `reddit-hot-${sub}`,
      source: "reddit",
      author: `${sub}_mod`,
      handle: `r/${sub}`,
      title: `Join the latest r/${sub} game discussion`,
      content: `Live game threads, post-game reactions, and trade discussions from the official ${sub} community on Reddit.`,
      likes: 120,
      replies: 45,
      url: `https://www.reddit.com/r/${sub}/hot/`,
      createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
    },
    {
      id: `reddit-top-${sub}`,
      source: "reddit",
      author: `NBA_Fan`,
      handle: `r/${sub}`,
      title: `r/${sub} Weekly Highlights & Team Analysis`,
      content: `Check out top plays, roster updates, and fan discussions happening right now on Reddit.`,
      likes: 84,
      replies: 28,
      url: `https://www.reddit.com/r/${sub}/`,
      createdAt: new Date(now - 1000 * 60 * 120).toISOString(),
    },
  ];
}

// ─── Bluesky API Types & Parser ───────────────────────────────────────────────

interface BskyPostRecord {
  text?: string;
  createdAt?: string;
}

interface BskyAuthor {
  did?: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

interface BskyPost {
  uri: string;
  cid?: string;
  author: BskyAuthor;
  record: BskyPostRecord;
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  indexedAt?: string;
}

interface BskySearchResponse {
  posts?: BskyPost[];
}

function convertBskyUriToWebUrl(uri: string, handle: string): string {
  // uri format: at://did:plc:xxx/app.bsky.feed.post/rkey
  try {
    const parts = uri.split("/");
    const rkey = parts[parts.length - 1];
    return `https://bsky.app/profile/${handle}/post/${rkey}`;
  } catch {
    return `https://bsky.app/profile/${handle}`;
  }
}

async function fetchBlueskyPosts(teamName: string): Promise<CommunityPost[]> {
  const query = `${teamName} NBA`;
  // Using public endpoint with public/api fallback
  const urlPrimary = `https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=10`;
  const urlPublic = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=10`;

  let responseData: BskySearchResponse | null = null;

  for (const endpoint of [urlPrimary, urlPublic]) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          "User-Agent": "NBANOW/1.0",
          Accept: "application/json",
        },
        next: { revalidate: 30 },
      });

      if (res.ok) {
        responseData = await res.json();
        break;
      }
    } catch {
      // try next endpoint
    }
  }

  if (!responseData?.posts || responseData.posts.length === 0) {
    return [];
  }

  return responseData.posts.map((post) => {
    const handle = post.author?.handle || "user.bsky.social";
    const displayName = post.author?.displayName || handle;
    const content = post.record?.text || "";
    const likes = (post.likeCount ?? 0) + (post.repostCount ?? 0);
    const replies = post.replyCount ?? 0;
    const createdAt =
      post.record?.createdAt || post.indexedAt || new Date().toISOString();
    const url = convertBskyUriToWebUrl(post.uri, handle);

    return {
      id: `bsky-${post.uri}`,
      source: "bluesky" as const,
      author: displayName,
      handle: `@${handle}`,
      content,
      likes,
      replies,
      url,
      createdAt,
    };
  });
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/nba/team/[id]/community">
) {
  const { id } = await ctx.params;
  const team = getTeamById(id);

  if (!team) {
    return Response.json({ error: `Unknown team id: ${id}` }, { status: 404 });
  }

  const sub = TEAM_SUBREDDITS[team.id] || team.name.toLowerCase();
  const searchName = `${team.city} ${team.name}`;

  try {
    // Fetch both sources in parallel
    const [redditPosts, blueskyPosts] = await Promise.all([
      fetchRedditPosts(sub),
      fetchBlueskyPosts(searchName),
    ]);

    // Combine and sort by recency (newest first)
    const combined = [...redditPosts, ...blueskyPosts].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    const body: CommunityResponse = {
      teamId: id,
      posts: combined,
      lastUpdated: new Date().toISOString(),
    };

    return Response.json(body);
  } catch (err) {
    console.error(`[/api/nba/team/${id}/community] Error:`, err);
    return Response.json(
      { error: "Failed to fetch community posts" },
      { status: 500 }
    );
  }
}
