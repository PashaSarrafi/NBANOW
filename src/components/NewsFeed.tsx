"use client";

import { ExternalLink, Newspaper } from "lucide-react";
import { type NBAArticle } from "@/lib/nba-data";

interface NewsFeedProps {
  articles: NBAArticle[];
  isLoading?: boolean;
}

export default function NewsFeed({
  articles,
  isLoading = false,
}: NewsFeedProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <NewsSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-zinc-600">
        <Newspaper size={28} />
        <p className="text-sm">No news available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 divide-y divide-white/5">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

function ArticleCard({ article }: { article: NBAArticle }) {
  const timeAgo = formatRelativeTime(article.published);

  const inner = (
    <div className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-white/5">
      {/* Thumbnail */}
      {article.thumbnailUrl && (
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.thumbnailUrl}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-xl object-cover bg-zinc-800"
            loading="lazy"
          />
        </div>
      )}
      {/* Text */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
          {article.headline}
        </p>
        {article.description && (
          <p className="text-xs text-zinc-500 leading-snug line-clamp-2">
            {article.description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600">{timeAgo}</span>
          {article.linkUrl && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="flex items-center gap-0.5 text-[10px] text-zinc-600">
                ESPN <ExternalLink size={9} />
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (article.linkUrl) {
    return (
      <a
        href={article.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {inner}
      </a>
    );
  }

  return <div>{inner}</div>;
}

function NewsSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3.5 animate-pulse">
      <div className="h-16 w-16 shrink-0 rounded-xl bg-zinc-800" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-3.5 w-full rounded bg-zinc-700" />
        <div className="h-3.5 w-4/5 rounded bg-zinc-700" />
        <div className="h-2.5 w-24 rounded bg-zinc-800 mt-1" />
      </div>
    </div>
  );
}

function formatRelativeTime(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}
