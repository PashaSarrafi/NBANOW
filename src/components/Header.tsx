"use client";

import { Trophy, RefreshCw, ChevronDown, Sparkles } from "lucide-react";
import type { NBATeam } from "@/lib/nba-data";

export type NavView = "hub" | "team";

interface HeaderProps {
  activeView: NavView;
  onViewChange: (view: NavView) => void;
  team: NBATeam | null;
  onChangeTeam: () => void;
  showingPicker: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  hasLiveGame: boolean;
  lastRefreshed: Date | null;
  onPromptTeamPicker: () => void;
}

export default function Header({
  activeView,
  onViewChange,
  team,
  onChangeTeam,
  showingPicker,
  isRefreshing,
  onRefresh,
  hasLiveGame,
  lastRefreshed,
  onPromptTeamPicker,
}: HeaderProps) {
  function handleMyTeamClick() {
    if (!team) {
      onPromptTeamPicker();
    } else {
      onViewChange("team");
    }
  }

  const myTeamLabel = team ? `My Team (${team.name})` : "My Team";

  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-white/8 bg-slate-950/95 backdrop-blur-md">
      {/* Top Bar: Brand, Live indicator, and actions */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-400">
            <Trophy size={16} />
          </div>
          <span className="text-base font-black tracking-tight text-white">
            NBA<span className="text-yellow-400">NOW</span>
          </span>
          {hasLiveGame && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              LIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title={
              lastRefreshed
                ? `Last updated ${lastRefreshed.toLocaleTimeString()}`
                : "Refresh data"
            }
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 focus:outline-none"
            aria-label="Refresh"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "animate-spin text-yellow-400" : ""}
            />
          </button>

          {/* Team Switcher Chip (visible on My Team view when team is chosen) */}
          {activeView === "team" && team && (
            <button
              onClick={onChangeTeam}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1 pr-2.5 pl-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50"
              title="Change favorite team"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={team.logoUrl}
                alt={team.abbreviation}
                width={16}
                height={16}
                className="h-4 w-4 object-contain"
              />
              <span className="max-w-[70px] truncate sm:max-w-none">
                {team.abbreviation}
              </span>
              <ChevronDown
                size={12}
                className={`text-zinc-400 transition-transform ${
                  showingPicker ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Pill Toggle Navigation */}
      <div className="px-4 pb-2.5 pt-0.5">
        <nav
          className="flex rounded-full border border-white/8 bg-zinc-900/90 p-1"
          aria-label="Main Navigation"
        >
          <button
            onClick={() => onViewChange("hub")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 px-3 text-xs font-bold transition-all ${
              activeView === "hub"
                ? "bg-yellow-400 text-black shadow-md shadow-yellow-400/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>🏀</span>
            <span>NBA Hub</span>
          </button>

          <button
            onClick={handleMyTeamClick}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 px-3 text-xs font-bold transition-all truncate ${
              activeView === "team"
                ? "bg-yellow-400 text-black shadow-md shadow-yellow-400/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {team ? <span>⭐</span> : <Sparkles size={12} className="text-yellow-400" />}
            <span className="truncate">{myTeamLabel}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
