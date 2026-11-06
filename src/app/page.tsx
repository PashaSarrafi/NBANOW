"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getTeamById,
  getAllTeams,
  type Game,
  type NBAArticle,
  type CommunityPost,
  type NBATeam,
} from "@/lib/nba-data";
import TeamSelector from "@/components/TeamSelector";
import ScheduleList from "@/components/ScheduleList";
import NewsFeed from "@/components/NewsFeed";
import CommunityFeed from "@/components/CommunityFeed";
import Header, { type NavView } from "@/components/Header";
import LeagueHub from "@/components/hub/LeagueHub";
import GameDetailModal from "@/components/GameDetailModal";
import { Newspaper, CalendarDays, MessageSquare } from "lucide-react";
import type { TeamScheduleResponse } from "@/app/api/nba/team/[id]/schedule/route";
import type { NewsResponse } from "@/app/api/nba/news/route";
import type { CommunityResponse } from "@/app/api/nba/team/[id]/community/route";

// ─── Constants ────────────────────────────────────────────────────────────────

type Tab = "schedule" | "news" | "community";
const LS_KEY = "nbanow_favoriteTeamId";
const POLL_INTERVAL_MS = 35_000; // 35-second live refresh

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [navView, setNavView] = useState<NavView>("hub");
  const [favoriteTeamId, setFavoriteTeamId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("schedule");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Data state for "My Team"
  const [schedule, setSchedule] = useState<Game[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [news, setNews] = useState<NBAArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  const [community, setCommunity] = useState<CommunityPost[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Hydrate from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stored = (window as any).localStorage?.getItem(LS_KEY);
    queueMicrotask(() => {
      if (stored) {
        setFavoriteTeamId(stored);
      }
      setHydrated(true);
    });
  }, []);

  // ── Fetch My Team Schedule ─────────────────────────────────────────────────
  const fetchSchedule = useCallback(
    async (teamId: string, silent = false) => {
      if (!silent) setScheduleLoading(true);
      else setIsRefreshing(true);
      setScheduleError(null);

      try {
        const res = await fetch(`/api/nba/team/${teamId}/schedule`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: TeamScheduleResponse = await res.json();
        setSchedule(data.games);
        setLastRefreshed(new Date());
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setScheduleError(msg);
      } finally {
        setScheduleLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // ── Fetch News ─────────────────────────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await fetch("/api/nba/news");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NewsResponse = await res.json();
      setNews(data.articles);
    } catch {
      // fail silently for news
    } finally {
      setNewsLoading(false);
    }
  }, []);

  // ── Fetch Community ────────────────────────────────────────────────────────
  const fetchCommunity = useCallback(async (teamId: string) => {
    setCommunityLoading(true);
    try {
      const res = await fetch(`/api/nba/team/${teamId}/community`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: CommunityResponse = await res.json();
      setCommunity(data.posts);
    } catch {
      // fail silently for community
    } finally {
      setCommunityLoading(false);
    }
  }, []);

  // ── Data loading for favorite team ─────────────────────────────────────────
  useEffect(() => {
    if (!favoriteTeamId || !hydrated) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSchedule(favoriteTeamId);
    fetchNews();
    fetchCommunity(favoriteTeamId);

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      fetchSchedule(favoriteTeamId, /* silent */ true);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [favoriteTeamId, hydrated, fetchSchedule, fetchNews, fetchCommunity]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleSelectTeam(teamId: string) {
    setFavoriteTeamId(teamId);
    localStorage.setItem(LS_KEY, teamId);
    setShowTeamPicker(false);
    setNavView("team");
    setActiveTab("schedule");
    setSelectedGame(null);
    setSchedule([]);
    setNews([]);
    setCommunity([]);
  }

  function handleGameClick(game: Game) {
    setSelectedGame(game);
  }

  function handleManualRefresh() {
    if (navView === "team" && favoriteTeamId) {
      fetchSchedule(favoriteTeamId, true);
      if (activeTab === "news") fetchNews();
      if (activeTab === "community") fetchCommunity(favoriteTeamId);
    } else {
      setIsRefreshing(true);
      fetchNews().finally(() => setIsRefreshing(false));
    }
  }

  // ── SSR Guard ──────────────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  const myTeam = favoriteTeamId ? (getTeamById(favoriteTeamId) ?? null) : null;
  const hasLiveGame = schedule.some((g) => g.status === "live");

  return (
    <div className="flex flex-1 flex-col bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col min-h-screen">
        {/* ── Header with Pill Navigation ── */}
        <Header
          activeView={navView}
          onViewChange={(v) => {
            setNavView(v);
            setShowTeamPicker(false);
          }}
          team={myTeam}
          onChangeTeam={() => setShowTeamPicker((p) => !p)}
          showingPicker={showTeamPicker}
          isRefreshing={isRefreshing}
          hasLiveGame={hasLiveGame}
          onRefresh={handleManualRefresh}
          lastRefreshed={lastRefreshed}
          onPromptTeamPicker={() => setShowTeamPicker(true)}
        />

        {/* ── Team picker overlay / drawer ── */}
        {showTeamPicker && (
          <section className="border-b border-white/8 bg-zinc-900/95 px-4 py-5 overflow-y-auto max-h-96 z-20">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                {favoriteTeamId ? "Switch favorite team" : "Pick favorite team"}
              </p>
              <button
                onClick={() => setShowTeamPicker(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
            <TeamSelector
              selectedTeamId={favoriteTeamId ?? undefined}
              onSelect={handleSelectTeam}
            />
          </section>
        )}

        {/* ── Main Content Area ── */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          {/* VIEW 1: NBA League Hub */}
          {navView === "hub" && (
            <LeagueHub onGameClick={handleGameClick} />
          )}

          {/* VIEW 2: My Team Hub */}
          {navView === "team" && (
            <>
              {!favoriteTeamId ? (
                <Onboarding onGetStarted={() => setShowTeamPicker(true)} />
              ) : myTeam ? (
                <div className="flex flex-col flex-1">
                  <TeamHubHeader team={myTeam} />

                  {/* Error banner */}
                  {scheduleError && (
                    <div className="mx-4 mt-3 flex items-center justify-between gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                      <p className="text-xs text-red-400">
                        Could not load schedule. Check your connection.
                      </p>
                      <button
                        onClick={handleManualRefresh}
                        className="shrink-0 rounded-lg bg-red-500/20 px-2 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="flex border-b border-white/8 px-4 pt-3 sticky top-0 bg-slate-950/90 backdrop-blur-sm z-10">
                    <TabButton
                      label="Schedule"
                      icon={<CalendarDays size={13} />}
                      active={activeTab === "schedule"}
                      onClick={() => setActiveTab("schedule")}
                    />
                    <TabButton
                      label="News"
                      icon={<Newspaper size={13} />}
                      active={activeTab === "news"}
                      onClick={() => setActiveTab("news")}
                    />
                    <TabButton
                      label="Community"
                      icon={<MessageSquare size={13} />}
                      active={activeTab === "community"}
                      onClick={() => setActiveTab("community")}
                    />
                  </div>

                  {/* Tab content */}
                  <div className="flex-1 pb-10">
                    {activeTab === "schedule" && (
                      <ScheduleList
                        games={schedule}
                        teamId={favoriteTeamId}
                        onGameClick={handleGameClick}
                        isLoading={scheduleLoading}
                      />
                    )}
                    {activeTab === "news" && (
                      <NewsFeed articles={news} isLoading={newsLoading} />
                    )}
                    {activeTab === "community" && (
                      <CommunityFeed posts={community} isLoading={communityLoading} />
                    )}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </main>

        {/* ── Game Detail Modal (opened when ANY game is clicked) ── */}
        <GameDetailModal
          game={selectedGame}
          myTeamId={favoriteTeamId}
          onClose={() => setSelectedGame(null)}
        />
      </div>
    </div>
  );
}

// ─── Team Hub Header ──────────────────────────────────────────────────────────

function TeamHubHeader({ team }: { team: NBATeam }) {
  return (
    <div
      className="relative overflow-hidden px-4 py-5"
      style={{
        background: `linear-gradient(135deg, ${team.primaryColor}30 0%, transparent 60%)`,
        borderBottom: `1px solid ${team.primaryColor}20`,
      }}
    >
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={team.logoUrl}
          alt={`${team.name} logo`}
          width={56}
          height={56}
          className="h-14 w-14 object-contain"
          priority-hint="high"
        />
        <div>
          <p
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: team.secondaryColor }}
          >
            {team.conference} Conference
          </p>
          <h1 className="text-xl font-black text-white">
            {team.city} {team.name}
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">2024–25 Season</p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 pb-3 pr-5 text-xs font-semibold transition-colors focus:outline-none ${
        active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {icon}
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-5 h-0.5 rounded-full bg-yellow-400" />
      )}
    </button>
  );
}

// ─── Onboarding (when no team chosen yet on My Team view) ──────────────────────

function Onboarding({ onGetStarted }: { onGetStarted: () => void }) {
  const teams = getAllTeams();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      {/* Floating logo strip */}
      <div className="flex -space-x-2">
        {teams.slice(0, 6).map((t) => (
          <div
            key={t.id}
            className="h-10 w-10 overflow-hidden rounded-full border-2 border-slate-950 bg-zinc-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.logoUrl}
              alt={t.abbreviation}
              width={40}
              height={40}
              className="h-full w-full object-contain p-1"
            />
          </div>
        ))}
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-950 bg-zinc-800 text-[10px] font-bold text-zinc-400">
          +{teams.length - 6}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <h1 className="text-2xl font-black text-white">Choose Your Favorite Team</h1>
        <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
          Pick your team to unlock dedicated game schedules, quarter breakdowns,
          subreddit discussions, and Bluesky team feeds.
        </p>
      </div>
      <button
        onClick={onGetStarted}
        className="rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50"
      >
        Select My Team →
      </button>
    </div>
  );
}
