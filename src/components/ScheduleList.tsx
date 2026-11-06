"use client";

import { Radio, Clock } from "lucide-react";
import {
  getTeamById,
  getOpponentTeam,
  getMyTeamInGame,
  isHomeGame,
  type Game,
} from "@/lib/nba-data";

interface ScheduleListProps {
  games: Game[];
  teamId: string;
  onGameClick: (game: Game) => void;
  isLoading?: boolean;
}

export default function ScheduleList({
  games,
  teamId,
  onGameClick,
  isLoading = false,
}: ScheduleListProps) {
  if (isLoading) {
    return (
      <ul className="flex flex-col divide-y divide-white/5">
        {Array.from({ length: 6 }).map((_, i) => (
          <ScheduleSkeleton key={i} />
        ))}
      </ul>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-500">
        <span className="text-4xl">📭</span>
        <p className="text-sm">No games found.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-white/5">
      {games.map((game) => (
        <GameRow
          key={game.id}
          game={game}
          teamId={teamId}
          onClick={() => onGameClick(game)}
        />
      ))}
    </ul>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ScheduleSkeleton() {
  return (
    <li className="px-4 py-3.5">
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-12 shrink-0 flex flex-col items-center gap-1">
          <div className="h-2.5 w-7 rounded bg-zinc-800" />
          <div className="h-4 w-5 rounded bg-zinc-700" />
        </div>
        <div className="w-5 shrink-0" />
        <div className="flex flex-1 items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-zinc-800" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3 w-32 rounded bg-zinc-700" />
            <div className="h-2.5 w-24 rounded bg-zinc-800" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="h-4 w-10 rounded-full bg-zinc-800" />
          <div className="h-3 w-14 rounded bg-zinc-700" />
        </div>
      </div>
    </li>
  );
}

// ─── Game Row ─────────────────────────────────────────────────────────────────

function GameRow({
  game,
  teamId,
  onClick,
}: {
  game: Game;
  teamId: string;
  onClick: () => void;
}) {
  const opponent = getOpponentTeam(game, teamId);
  const myTeamInGame = getMyTeamInGame(game, teamId);
  const home = isHomeGame(game, teamId);

  const myScore = myTeamInGame.score;
  const theirScore = opponent.score;
  const won =
    game.status === "final" &&
    myScore !== undefined &&
    theirScore !== undefined &&
    myScore > theirScore;

  // Look up the static team for the primary color
  const myStaticTeam = getTeamById(teamId);
  const primaryColor = myStaticTeam?.primaryColor ?? "#a1a1aa";

  return (
    <li>
      <button
        onClick={onClick}
        className="group w-full px-4 py-3.5 text-left transition-colors hover:bg-white/5 focus:outline-none focus-visible:bg-white/5"
      >
        <div className="flex items-center gap-3">
          {/* Date column */}
          <div className="w-12 shrink-0 text-center">
            <DateBadge date={game.date} />
          </div>

          {/* H/A tag */}
          <span className="w-5 shrink-0 text-center text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
            {home ? "vs" : "@"}
          </span>

          {/* Opponent logo + name */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={opponent.logoUrl}
              alt={`${opponent.name} logo`}
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain"
              loading="lazy"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {opponent.name}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {opponent.record
                  ? `${opponent.record} · ${game.arena ?? ""}`
                  : (game.arena ?? "")}
              </p>
            </div>
          </div>

          {/* Score / status */}
          <ScoreBadge
            game={game}
            myScore={myScore}
            theirScore={theirScore}
            won={won}
            primaryColor={primaryColor}
          />
        </div>
      </button>
    </li>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DateBadge({ date }: { date: string }) {
  const d = new Date(date);
  const month = d.toLocaleDateString(undefined, { month: "short" });
  const day = d.toLocaleDateString(undefined, { day: "numeric" });
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
        {month}
      </span>
      <span className="text-base font-bold text-white leading-tight">{day}</span>
    </div>
  );
}

function ScoreBadge({
  game,
  myScore,
  theirScore,
  won,
  primaryColor,
}: {
  game: Game;
  myScore?: number;
  theirScore?: number;
  won: boolean;
  primaryColor: string;
}) {
  if (game.status === "live") {
    return (
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-red-400 uppercase">
          <Radio size={8} className="animate-pulse" />
          LIVE
        </span>
        <span className="text-sm font-bold text-white">
          {myScore} – {theirScore}
        </span>
        {game.period && (
          <span className="text-[10px] text-zinc-500">{game.period}</span>
        )}
      </div>
    );
  }

  if (game.status === "final") {
    return (
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
          Final
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: won ? primaryColor : "#a1a1aa" }}
        >
          {myScore} – {theirScore}
        </span>
        <span className="text-[10px] font-semibold text-zinc-500">
          {won ? "W" : "L"}
        </span>
      </div>
    );
  }

  // scheduled
  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
        <Clock size={9} />
        {game.time ?? "TBD"}
      </span>
      {game.broadcasts && game.broadcasts.length > 0 && (
        <span className="text-[10px] text-zinc-600">{game.broadcasts[0]}</span>
      )}
    </div>
  );
}
