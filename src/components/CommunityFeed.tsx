"use client";

import { ExternalLink, Heart, MessageSquare, ArrowUp, MessageCircle, Users } from "lucide-react";
import type { CommunityPost } from "@/lib/nba-data";

interface CommunityFeedProps {
  posts: CommunityPost[];
  isLoading?: boolean;
}

export default function CommunityFeed({
  posts,
  isLoading = false,
}: CommunityFeedProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-0 divide-y divide-white/5">
        {Array.from({ length: 5 }).map((_, i) => (
          <CommunitySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-500">
        <Users size={32} />
        <p className="text-sm">No community discussions found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-white/5">
      {posts.map((post) => (
        <CommunityCard key={post.id} post={post} />
      ))}
    </div>
  );
}

function CommunityCard({ post }: { post: CommunityPost }) {
  const isReddit = post.source === "reddit";
  const relativeTime = formatRelativeTime(post.createdAt);

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block px-4 py-3.5 transition-colors hover:bg-white/5 focus:outline-none focus-visible:bg-white/5"
    >
      <div className="flex flex-col gap-2">
        {/* Header: Source Badge + Author info + Time */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isReddit ? (
              <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/20">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
                Reddit
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/20">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400" />
                Bluesky
              </span>
            )}

            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="truncate text-xs font-semibold text-white">
                {post.author}
              </span>
              <span className="truncate text-[11px] text-zinc-500">
                {post.handle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors">
            <span className="text-[10px]">{relativeTime}</span>
            <ExternalLink size={11} />
          </div>
        </div>

        {/* Title (for Reddit) or Content */}
        {post.title && isReddit ? (
          <div>
            <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-yellow-400 transition-colors">
              {post.title}
            </h3>
            {post.content && post.content !== post.title && (
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed line-clamp-2">
                {post.content}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-200 leading-relaxed line-clamp-3 group-hover:text-white transition-colors">
            {post.content}
          </p>
        )}

        {/* Footer: Counters */}
        <div className="flex items-center gap-4 pt-1">
          {isReddit ? (
            <>
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <ArrowUp size={13} className="text-orange-400" />
                <span className="font-semibold text-zinc-300">
                  {formatNumber(post.likes)}
                </span>
                <span className="text-[10px] text-zinc-500">upvotes</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <MessageSquare size={13} className="text-zinc-500" />
                <span className="font-semibold text-zinc-300">
                  {formatNumber(post.replies)}
                </span>
                <span className="text-[10px] text-zinc-500">comments</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <Heart size={13} className="text-rose-400" />
                <span className="font-semibold text-zinc-300">
                  {formatNumber(post.likes)}
                </span>
                <span className="text-[10px] text-zinc-500">likes</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <MessageCircle size={13} className="text-zinc-500" />
                <span className="font-semibold text-zinc-300">
                  {formatNumber(post.replies)}
                </span>
                <span className="text-[10px] text-zinc-500">replies</span>
              </div>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

function CommunitySkeleton() {
  return (
    <div className="px-4 py-3.5 animate-pulse flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-14 rounded-full bg-zinc-800" />
          <div className="h-3 w-20 rounded bg-zinc-700" />
        </div>
        <div className="h-3 w-10 rounded bg-zinc-800" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-11/12 rounded bg-zinc-700" />
        <div className="h-3 w-4/5 rounded bg-zinc-800" />
      </div>
      <div className="flex items-center gap-4 pt-1">
        <div className="h-3 w-12 rounded bg-zinc-800" />
        <div className="h-3 w-12 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

function formatRelativeTime(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    if (isNaN(diff)) return "";
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

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}
