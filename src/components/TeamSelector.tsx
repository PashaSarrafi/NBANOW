"use client";

import { getAllTeams, type NBATeam } from "@/lib/nba-data";
import { Check } from "lucide-react";

interface TeamSelectorProps {
  selectedTeamId?: string;
  onSelect: (teamId: string) => void;
}

export default function TeamSelector({
  selectedTeamId,
  onSelect,
}: TeamSelectorProps) {
  const teams = getAllTeams();

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          isSelected={team.id === selectedTeamId}
          onSelect={() => onSelect(team.id)}
        />
      ))}
    </div>
  );
}

function TeamCard({
  team,
  isSelected,
  onSelect,
}: {
  team: NBATeam;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      style={
        isSelected
          ? {
              borderColor: team.primaryColor,
              backgroundColor: `${team.primaryColor}22`,
              boxShadow: `0 0 0 1px ${team.primaryColor}`,
            }
          : {
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.03)",
            }
      }
      aria-pressed={isSelected}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <span
          className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full"
          style={{ backgroundColor: team.primaryColor }}
        >
          <Check size={10} strokeWidth={3} className="text-white" />
        </span>
      )}

      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={team.logoUrl}
        alt={`${team.name} logo`}
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
        loading="lazy"
      />

      {/* Team info */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
          {team.city}
        </span>
        <span className="text-xs font-semibold text-white leading-tight">{team.name}</span>
      </div>
    </button>
  );
}
