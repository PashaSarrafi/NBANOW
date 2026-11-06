"use client";

import { ArrowLeft, ExternalLink, Play, Radio, Tv, MapPin } from "lucide-react";
import {
  getTeamById,
  isHomeGame,
  type Game,
  type GameTeam,
} from "@/lib/nba-data";
import { getStreamingLinks, type StreamOption } from "@/lib/stream-helpers";
import { getYoutubeHighlightLink } from "@/lib/youtube-helpers";

interface GameDetailViewProps {
  game: Game;
  /** The user's team id – used to decide home/away perspective if participating */
  myTeamId?: string | null;
  onBack: () => void;
  isLoading?: boolean;
}

export default function GameDetailView({
  game,
  myTeamId,
  onBack,
  isLoading = false,
}: GameDetailViewProps) {
  if (isLoading) {
    return <GameDetailSkeleton onBack={onBack} />;
  }

  const { homeTeam, awayTeam } = game;
  const isUserTeamGame = Boolean(
    myTeamId && (homeTeam.id === myTeamId || awayTeam.id === myTeamId)
  );
  const home = isUserTeamGame ? isHomeGame(game, myTeamId!) : true;
  const myTeamInGame = home ? homeTeam : awayTeam;
  const theirTeamInGame = home ? awayTeam : homeTeam;

  const myScore = myTeamInGame.score;
  const theirScore = theirTeamInGame.score;
  const won =
    game.status === "final" &&
    myScore !== undefined &&
    theirScore !== undefined &&
    myScore > theirScore;

  const myStaticTeam = myTeamId ? getTeamById(myTeamId) : undefined;
  const homeStaticTeam = getTeamById(homeTeam.id);

  const gameDate = new Date(game.date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-0">
      {/* Back button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:text-white"
        >
          <ArrowLeft size={16} />
          Back to Schedule
        </button>
      </div>

      {/* Matchup header */}
      <MatchupHeader
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        game={game}
        myTeamId={myTeamId}
        won={won}
        homePrimaryColor={homeStaticTeam?.primaryColor}
        myPrimaryColor={myStaticTeam?.primaryColor}
      />

      {/* Quarter breakdown */}
      {(homeTeam.quarters || awayTeam.quarters) && (
        <section className="px-4 pt-4">
          <h2 className="mb-3 text-xs font-bold tracking-widest text-zinc-500 uppercase">
            Scoring by Quarter
          </h2>
          <QuarterTable homeTeam={homeTeam} awayTeam={awayTeam} game={game} />
        </section>
      )}

      {/* Where to Stream / Watch */}
      <WatchSection broadcasts={game.broadcasts} status={game.status} />

      {/* Highlights (Completed Games) */}
      <HighlightsSection game={game} />

      {/* Game info */}
      <section className="mt-4 px-4">
        <h2 className="mb-3 text-xs font-bold tracking-widest text-zinc-500 uppercase">
          Game Info
        </h2>
        <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/3 p-4">
          {game.arena && (
            <InfoRow icon={<MapPin size={15} className="text-zinc-500" />}>
              {game.arena}
            </InfoRow>
          )}
          {game.broadcasts && game.broadcasts.length > 0 && (
            <InfoRow icon={<Tv size={15} className="text-zinc-500" />}>
              {game.broadcasts.join(", ")}
            </InfoRow>
          )}
          <InfoRow icon={<span className="text-zinc-500 text-sm">📅</span>}>
            {gameDate}
            {game.time ? ` · ${game.time}` : ""}
          </InfoRow>
          {homeTeam.record && (
            <InfoRow icon={<span className="text-zinc-500 text-sm">📊</span>}>
              {awayTeam.abbreviation} {awayTeam.record ?? "–"} · {homeTeam.abbreviation} {homeTeam.record ?? "–"}
            </InfoRow>
          )}
        </div>
      </section>

      {/* Live status bar */}
      {game.status === "live" && game.period && (
        <div className="mx-4 mt-4 flex items-center justify-center gap-2 rounded-full border border-red-500/20 bg-red-500/15 px-4 py-2">
          <Radio size={12} className="animate-pulse text-red-400" />
          <span className="text-sm font-bold text-red-400">
            IN PROGRESS – {game.period}
          </span>
        </div>
      )}

      {game.status === "scheduled" && (
        <div className="mx-4 mt-4 flex items-center justify-center gap-2 rounded-full border border-white/8 bg-zinc-800/80 px-4 py-2">
          <span className="text-sm font-medium text-zinc-400">
            Tip-off {game.time ?? "TBD"}
          </span>
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GameDetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col gap-0 animate-pulse">
      <div className="px-4 pt-4 pb-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-zinc-400">
          <ArrowLeft size={16} />
          Back to Schedule
        </button>
      </div>
      <div className="px-4 py-6 flex justify-between items-center gap-4">
        <div className="flex flex-col items-start gap-3 flex-1">
          <div className="h-14 w-14 rounded-full bg-zinc-800" />
          <div className="h-3 w-20 rounded bg-zinc-700" />
          <div className="h-8 w-12 rounded bg-zinc-800" />
        </div>
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="h-3 w-10 rounded bg-zinc-800" />
          <div className="h-6 w-4 rounded bg-zinc-700" />
        </div>
        <div className="flex flex-col items-end gap-3 flex-1">
          <div className="h-14 w-14 rounded-full bg-zinc-800" />
          <div className="h-3 w-20 rounded bg-zinc-700" />
          <div className="h-8 w-12 rounded bg-zinc-800" />
        </div>
      </div>
      <div className="mx-4 h-24 rounded-2xl bg-zinc-800/50" />
      <div className="mx-4 mt-4 h-28 rounded-2xl bg-zinc-800/50" />
    </div>
  );
}

// ─── Matchup Header ───────────────────────────────────────────────────────────

function MatchupHeader({
  homeTeam,
  awayTeam,
  game,
  myTeamId,
  won,
  homePrimaryColor,
  myPrimaryColor,
}: {
  homeTeam: GameTeam;
  awayTeam: GameTeam;
  game: Game;
  myTeamId?: string | null;
  won: boolean;
  homePrimaryColor?: string;
  myPrimaryColor?: string;
}) {
  const isUserMatch = Boolean(
    myTeamId && (homeTeam.id === myTeamId || awayTeam.id === myTeamId)
  );
  const homeScore = homeTeam.score ?? 0;
  const awayScore = awayTeam.score ?? 0;
  const homeWon = isUserMatch
    ? homeTeam.id === myTeamId
      ? won
      : !won && game.status === "final"
    : game.status === "final" && homeScore > awayScore;
  const awayWon = isUserMatch
    ? awayTeam.id === myTeamId
      ? won
      : !won && game.status === "final"
    : game.status === "final" && awayScore > homeScore;

  return (
    <div className="relative overflow-hidden px-4 pt-2 pb-6">
      {/* subtle gradient bg using home team color */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          background: homePrimaryColor
            ? `radial-gradient(ellipse at top, ${homePrimaryColor} 0%, transparent 70%)`
            : undefined,
        }}
      />

      <div className="relative flex items-center justify-between gap-4">
        {/* Away team */}
        <TeamScoreBlock
          team={awayTeam}
          isHome={false}
          isMyTeam={Boolean(myTeamId && awayTeam.id === myTeamId)}
          won={awayWon}
          gameStatus={game.status}
          myPrimaryColor={myPrimaryColor}
        />

        {/* Centre divider */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-xs font-bold tracking-widest text-zinc-600 uppercase">
            {game.status === "final"
              ? "Final"
              : game.status === "live"
              ? "Live"
              : "vs"}
          </span>
          {game.status !== "scheduled" && (
            <span className="text-2xl font-black text-zinc-500">–</span>
          )}
        </div>

        {/* Home team */}
        <TeamScoreBlock
          team={homeTeam}
          isHome={true}
          isMyTeam={Boolean(myTeamId && homeTeam.id === myTeamId)}
          won={homeWon}
          gameStatus={game.status}
          myPrimaryColor={myPrimaryColor}
        />
      </div>
    </div>
  );
}

function TeamScoreBlock({
  team,
  isHome,
  isMyTeam,
  won,
  myPrimaryColor,
}: {
  team: GameTeam;
  isHome: boolean;
  isMyTeam: boolean;
  won: boolean;
  gameStatus: Game["status"];
  myPrimaryColor?: string;
}) {
  return (
    <div
      className={`flex flex-1 flex-col gap-2 ${
        isHome ? "items-end" : "items-start"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={team.logoUrl}
        alt={`${team.name} logo`}
        width={56}
        height={56}
        className="h-14 w-14 object-contain"
        loading="lazy"
      />
      <div className={`flex flex-col ${isHome ? "items-end" : "items-start"}`}>
        <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
          {isHome ? "Home" : "Away"} · {team.abbreviation}
        </span>
        <span className="text-sm font-semibold text-white">{team.name}</span>
        {team.record && (
          <span className="text-[10px] text-zinc-600">{team.record}</span>
        )}
      </div>
      {team.score !== undefined && (
        <span
          className="text-4xl font-black"
          style={{
            color: isMyTeam
              ? won
                ? (myPrimaryColor ?? "#ffffff")
                : "#a1a1aa"
              : won
              ? "#ffffff"
              : "#71717a",
          }}
        >
          {team.score}
        </span>
      )}
    </div>
  );
}

// ─── Quarter Table ────────────────────────────────────────────────────────────

function QuarterTable({
  homeTeam,
  awayTeam,
}: {
  homeTeam: GameTeam;
  awayTeam: GameTeam;
  game: Game;
}) {
  const hq = homeTeam.quarters ?? {};
  const aq = awayTeam.quarters ?? {};

  // Find the max quarter index present in either team's data
  const allKeys = new Set([
    ...Object.keys(hq).map(Number),
    ...Object.keys(aq).map(Number),
  ]);
  const maxQ = allKeys.size > 0 ? Math.max(...allKeys) : 4;
  const quarterCount = Math.max(maxQ, 4);

  const quarters = Array.from({ length: quarterCount }, (_, i) => {
    const q = i + 1;
    return {
      label: q <= 4 ? `Q${q}` : `OT${q > 5 ? q - 4 : ""}`,
      home: hq[q],
      away: aq[q],
    };
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/8 bg-white/3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8">
            <th className="py-2 pl-4 pr-2 text-left text-xs font-bold tracking-wider text-zinc-500 uppercase">
              Team
            </th>
            {quarters.map((q) => (
              <th
                key={q.label}
                className="px-2 py-2 text-center text-xs font-bold tracking-wider text-zinc-500 uppercase"
              >
                {q.label}
              </th>
            ))}
            <th className="py-2 pr-4 pl-2 text-center text-xs font-bold tracking-wider text-zinc-400 uppercase">
              T
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Away row */}
          <tr className="border-b border-white/5">
            <td className="py-2.5 pl-4 pr-2">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={awayTeam.logoUrl}
                  alt={awayTeam.abbreviation}
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
                <span className="font-bold text-white">{awayTeam.abbreviation}</span>
              </div>
            </td>
            {quarters.map((q) => (
              <td
                key={q.label}
                className="px-2 py-2.5 text-center font-semibold text-zinc-300"
              >
                {q.away ?? "–"}
              </td>
            ))}
            <td className="py-2.5 pr-4 pl-2 text-center font-black text-white">
              {awayTeam.score ?? "–"}
            </td>
          </tr>
          {/* Home row */}
          <tr>
            <td className="py-2.5 pl-4 pr-2">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={homeTeam.logoUrl}
                  alt={homeTeam.abbreviation}
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
                <span className="font-bold text-white">{homeTeam.abbreviation}</span>
              </div>
            </td>
            {quarters.map((q) => (
              <td
                key={q.label}
                className="px-2 py-2.5 text-center font-semibold text-zinc-300"
              >
                {q.home ?? "–"}
              </td>
            ))}
            <td className="py-2.5 pr-4 pl-2 text-center font-black text-white">
              {homeTeam.score ?? "–"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-sm text-zinc-300">{children}</span>
    </div>
  );
}

// ─── Where to Watch Section ───────────────────────────────────────────────────

function WatchSection({
  broadcasts,
  status,
}: {
  broadcasts?: string[];
  status: Game["status"];
}) {
  const options: StreamOption[] = getStreamingLinks(
    broadcasts ?? [],
    status === "final"
  );

  if (options.length === 0) return null;

  return (
    <section className="mt-4 px-4">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
          Where to Watch
        </h2>
        {status === "live" && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-red-400">
            <Radio size={12} className="animate-pulse" />
            Watch Live
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <a
            key={`${opt.name}-${opt.platform}`}
            href={opt.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex items-center justify-between rounded-2xl border p-3.5 transition-all hover:opacity-90 active:scale-[0.99] ${opt.badgeColor}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/25">
                <Tv size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white group-hover:underline">
                  {opt.name}
                </span>
                <span className="text-xs opacity-75">{opt.platform}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-current/25 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase opacity-85">
                {opt.type}
              </span>
              <ExternalLink
                size={14}
                className="opacity-70 transition-opacity group-hover:opacity-100"
              />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

// ─── Highlights Section ───────────────────────────────────────────────────────

function HighlightsSection({ game }: { game: Game }) {
  const highlightUrl = getYoutubeHighlightLink({
    homeTeam: game.homeTeam.name,
    awayTeam: game.awayTeam.name,
    date: game.date,
    status: game.status,
  });

  if (!highlightUrl) return null;

  return (
    <section className="mt-4 px-4">
      <h2 className="mb-2.5 text-xs font-bold tracking-widest text-zinc-500 uppercase">
        Game Highlights
      </h2>
      <a
        href={highlightUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between rounded-2xl border border-red-500/25 bg-red-500/10 p-3.5 transition-all hover:border-red-500/40 hover:bg-red-500/15 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30 transition-transform group-hover:scale-105">
            <Play size={18} className="ml-0.5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white group-hover:underline">
              Full Game Highlights
            </span>
            <span className="text-xs text-zinc-400">
              Watch official recap on YouTube
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/20 px-2.5 py-1 text-xs font-bold text-red-300">
          <span>Watch</span>
          <ExternalLink size={13} />
        </div>
      </a>
    </section>
  );
}
