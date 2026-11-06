"use client";

import { useEffect } from "react";
import GameDetailView from "@/components/GameDetailView";
import type { Game } from "@/lib/nba-data";

interface GameDetailModalProps {
  game: Game | null;
  myTeamId?: string | null;
  onClose: () => void;
}

export default function GameDetailModal({
  game,
  myTeamId,
  onClose,
}: GameDetailModalProps) {
  useEffect(() => {
    if (!game) return;

    // Prevent background scrolling while modal is open
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [game, onClose]);

  if (!game) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-slate-950 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <GameDetailView
          game={game}
          myTeamId={myTeamId}
          onBack={onClose}
        />
      </div>
    </div>
  );
}
