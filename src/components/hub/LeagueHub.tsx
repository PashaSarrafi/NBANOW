"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Newspaper,
  Flame,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { Game, NBAArticle } from "@/lib/nba-data";
import NewsFeed from "@/components/NewsFeed";
import type { ScoreboardResponse } from "@/app/api/nba/scoreboard/route";
import type { NewsResponse } from "@/app/api/nba/news/route";

interface LeagueHubProps {
  onGameClick: (game: Game) => void;
}

const SCOREBOARD_POLL_MS = 35_000;

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default function LeagueHub({ onGameClick }: LeagueHubProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesError, setGamesError] = useState<string | null>(null);

  const [articles, setArticles] = useState<NBAArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch Scoreboard for selected date ──────────────────────────────────────
  const fetchScoreboard = useCallback(
    async (targetDate: Date, silent = false) => {
      if (!silent) setGamesLoading(true);
      setGamesError(null);

      const ymd = formatYMD(targetDate);
      try {
        const res = await fetch(`/api/nba/scoreboard?dates=${ymd}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ScoreboardResponse = await res.json();
        setGames(data.games ?? []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load scoreboard";
        setGamesError(msg);
      } finally {
        setGamesLoading(false);
      }
    },
    []
  );

  // ── Fetch League News ───────────────────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    setArticlesLoading(true);
    try {
      const res = await fetch("/api/nba/news");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NewsResponse = await res.json();
      setArticles(data.articles ?? []);
    } catch {
      // fail silently
    } finally {
      setArticlesLoading(false);
    }
  }, []);

  // ── Load data on date change ────────────────────────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchScoreboard(selectedDate);
  }, [selectedDate, fetchScoreboard]);

  // ── Load news on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNews();
  }, [fetchNews]);

  // ── Auto-refresh live games ─────────────────────────────────────────────────
  useEffect(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    // Only poll if viewing today
    if (isSameDay(selectedDate, new Date())) {
      pollTimerRef.current = setInterval(() => {
        fetchScoreboard(selectedDate, true);
      }, SCOREBOARD_POLL_MS);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [selectedDate, fetchScoreboard]);

  // ── Date Navigation Handlers ────────────────────────────────────────────────
  function handlePrevDay() {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  }

  function handleNextDay() {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  }

  function handleResetToday() {
    setSelectedDate(new Date());
  }

  const isToday = isSameDay(selectedDate, new Date());
  const dateLabel = isToday
    ? `Today (${selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })})`
    : selectedDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── Today's NBA Scoreboard Section ── */}
      <section className="px-4 pt-3">
        {/* Section Header & Date Controls */}
        <div className="mb-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🏀</span>
              <h2 className="text-sm font-black tracking-tight text-white uppercase">
                NBA Scoreboard
              </h2>
            </div>
            {games.some((g) => g.status === "live") && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-red-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                Live Games
              </span>
            )}
          </div>

          {/* Date Picker Bar */}
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-zinc-900/80 p-1">
            <button
              onClick={handlePrevDay}
              aria-label="Previous day"
              className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-zinc-400 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
            >
              <ChevronLeft size={15} />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <button
              onClick={handleResetToday}
              title={isToday ? "Current date" : "Click to return to Today"}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                isToday
                  ? "bg-yellow-400/15 text-yellow-400 border border-yellow-400/25"
                  : "text-zinc-200 hover:bg-white/10"
              }`}
            >
              <Calendar size={13} className={isToday ? "text-yellow-400" : "text-zinc-400"} />
              <span>{dateLabel}</span>
            </button>

            <button
              onClick={handleNextDay}
              aria-label="Next day"
              className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-zinc-400 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Scoreboard Content */}
        {gamesLoading ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <ScoreboardSkeleton key={i} />
            ))}
          </div>
        ) : gamesError ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-xs text-red-300">Could not load scoreboard for this date.</p>
            <button
              onClick={() => fetchScoreboard(selectedDate)}
              className="mt-1 flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/30"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-zinc-900/40 p-8 text-center text-zinc-500">
            <Calendar size={24} className="text-zinc-600" />
            <p className="text-xs font-medium">No NBA games scheduled for this date.</p>
            {!isToday && (
              <button
                onClick={handleResetToday}
                className="mt-1 text-xs font-bold text-yellow-400 underline hover:text-yellow-300"
              >
                Return to Today&apos;s Games
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {games.map((game) => (
              <HubGameCard
                key={game.id}
                game={game}
                onClick={() => onGameClick(game)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── League News Section ── */}
      <section className="px-4">
        <div className="mb-3 flex items-center justify-between border-t border-white/8 pt-5">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-400" />
            <h2 className="text-sm font-black tracking-tight text-white uppercase">
              League Headlines
            </h2>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
            <Newspaper size={12} />
            Top Stories
          </span>
        </div>

        <div className="rounded-2xl border border-white/8 bg-zinc-900/40 overflow-hidden">
          <NewsFeed articles={articles} isLoading={articlesLoading} />
        </div>
      </section>
    </div>
  );
}

// ─── Compact Game Card ────────────────────────────────────────────────────────

function HubGameCard({
  game,
  onClick,
}: {
  game: Game;
  onClick: () => void;
}) {
  const isFinal = game.status === "final";
  const isLive = game.status === "live";

  const awayScore = game.awayTeam.score ?? 0;
  const homeScore = game.homeTeam.score ?? 0;
  const awayWon = isFinal && awayScore > homeScore;
  const homeWon = isFinal && homeScore > awayScore;

  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-white/8 bg-zinc-900/60 p-3.5 text-left transition-all hover:border-yellow-400/30 hover:bg-zinc-800/60 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50"
    >
      {/* Card Header Status */}
      <div className="mb-2.5 flex items-center justify-between border-b border-white/5 pb-2 text-[11px]">
        {isLive ? (
          <span className="flex items-center gap-1.5 font-bold text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
            {game.period ?? "LIVE"}
          </span>
        ) : isFinal ? (
          <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
            Final
          </span>
        ) : (
          <span className="flex items-center gap-1 font-semibold text-zinc-400">
            <Clock size={11} className="text-zinc-500" />
            {game.time ?? "Scheduled"}
          </span>
        )}

        {game.broadcasts && game.broadcasts.length > 0 ? (
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
            {game.broadcasts[0]}
          </span>
        ) : game.arena ? (
          <span className="max-w-[130px] truncate text-[10px] text-zinc-500">
            {game.arena.split(",")[0]}
          </span>
        ) : null}
      </div>

      {/* Away Team Row */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={game.awayTeam.logoUrl}
            alt={game.awayTeam.abbreviation}
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 object-contain"
            loading="lazy"
          />
          <div className="flex flex-col min-w-0">
            <span
              className={`truncate text-xs font-bold leading-tight ${
                awayWon
                  ? "text-white"
                  : isFinal
                  ? "text-zinc-400 font-medium"
                  : "text-white"
              }`}
            >
              {game.awayTeam.name}
            </span>
            {game.awayTeam.record && (
              <span className="text-[10px] text-zinc-500 truncate">
                {game.awayTeam.record}
              </span>
            )}
          </div>
        </div>

        {game.awayTeam.score !== undefined && (
          <span
            className={`text-base font-black shrink-0 ${
              awayWon
                ? "text-white"
                : isFinal
                ? "text-zinc-500"
                : "text-white"
            }`}
          >
            {game.awayTeam.score}
          </span>
        )}
      </div>

      {/* Home Team Row */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={game.homeTeam.logoUrl}
            alt={game.homeTeam.abbreviation}
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 object-contain"
            loading="lazy"
          />
          <div className="flex flex-col min-w-0">
            <span
              className={`truncate text-xs font-bold leading-tight ${
                homeWon
                  ? "text-white"
                  : isFinal
                  ? "text-zinc-400 font-medium"
                  : "text-white"
              }`}
            >
              {game.homeTeam.name}
            </span>
            {game.homeTeam.record && (
              <span className="text-[10px] text-zinc-500 truncate">
                {game.homeTeam.record}
              </span>
            )}
          </div>
        </div>

        {game.homeTeam.score !== undefined && (
          <span
            className={`text-base font-black shrink-0 ${
              homeWon
                ? "text-white"
                : isFinal
                ? "text-zinc-500"
                : "text-white"
            }`}
          >
            {game.homeTeam.score}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Scoreboard Skeleton ──────────────────────────────────────────────────────

function ScoreboardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-white/5 bg-zinc-900/40 p-3.5 animate-pulse">
      <div className="mb-3 flex justify-between border-b border-white/5 pb-2">
        <div className="h-3 w-16 rounded bg-zinc-800" />
        <div className="h-3 w-12 rounded bg-zinc-800" />
      </div>
      <div className="flex justify-between items-center py-1.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-zinc-800" />
          <div className="h-3.5 w-24 rounded bg-zinc-800" />
        </div>
        <div className="h-4 w-6 rounded bg-zinc-800" />
      </div>
      <div className="flex justify-between items-center py-1.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-zinc-800" />
          <div className="h-3.5 w-24 rounded bg-zinc-800" />
        </div>
        <div className="h-4 w-6 rounded bg-zinc-800" />
      </div>
    </div>
  );
}
