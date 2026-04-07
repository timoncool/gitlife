"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Header } from "@/components/header";
import { useSession } from "@/lib/auth-client";
import { Trophy, ArrowUpDown, Crown, Flame, Zap, Calendar } from "lucide-react";
import {
  mapContributionsToWeeks,
  calculateStats,
  generateGridCells,
} from "@/lib/grid-utils";
import type { ContributionWeek, YearContribution } from "@/lib/types";

// ── Famous devs constant (same as landing page) ─────────────────────────────

type DevCategory = "Frontend" | "Backend" | "DevTools" | "AI" | "OS & Systems" | "Creators";

const FAMOUS_DEVS: {
  username: string; label: string; tag: string; birthYear: number;
  country: string; expectedAge: number; description: string; category: DevCategory;
  tags: string[];
}[] = [
  { username: "yyx990803", label: "Evan You", tag: "Vue.js", birthYear: 1987, country: "USA", expectedAge: 80, description: "Creator of Vue.js and Vite.", category: "Frontend", tags: ["JavaScript", "TypeScript"] },
  { username: "rich-harris", label: "Rich Harris", tag: "Svelte", birthYear: 1985, country: "USA", expectedAge: 79, description: "Creator of Svelte and SvelteKit.", category: "Frontend", tags: ["JavaScript", "TypeScript"] },
  { username: "gaearon", label: "Dan Abramov", tag: "React", birthYear: 1992, country: "GBR", expectedAge: 80, description: "Co-creator of Redux, React core team.", category: "Frontend", tags: ["JavaScript", "TypeScript", "React"] },
  { username: "addyosmani", label: "Addy Osmani", tag: "Chrome", birthYear: 1986, country: "USA", expectedAge: 79, description: "Engineering lead on Google Chrome.", category: "Frontend", tags: ["JavaScript", "TypeScript"] },
  { username: "tannerlinsley", label: "Tanner Linsley", tag: "TanStack", birthYear: 1991, country: "USA", expectedAge: 79, description: "Creator of TanStack Query, Table, Router.", category: "Frontend", tags: ["JavaScript", "TypeScript", "React"] },
  { username: "sebmck", label: "Sebastian McKenzie", tag: "Babel", birthYear: 1994, country: "GBR", expectedAge: 73, description: "Creator of Babel and Biome.", category: "Frontend", tags: ["JavaScript", "TypeScript"] },
  { username: "torvalds", label: "Linus Torvalds", tag: "Linux", birthYear: 1969, country: "USA", expectedAge: 82, description: "Creator of Linux and Git.", category: "OS & Systems", tags: ["C", "Linux"] },
  { username: "bellard", label: "Fabrice Bellard", tag: "FFmpeg / QEMU", birthYear: 1972, country: "FRA", expectedAge: 84, description: "Creator of FFmpeg, QEMU, QuickJS.", category: "OS & Systems", tags: ["C"] },
  { username: "karpathy", label: "Andrej Karpathy", tag: "Tesla AI", birthYear: 1986, country: "USA", expectedAge: 87, description: "Ex-Tesla AI director, OpenAI founding member.", category: "AI", tags: ["Python", "AI"] },
  { username: "lllyasviel", label: "Lvmin Zhang", tag: "ControlNet", birthYear: 1995, country: "CHN", expectedAge: 75, description: "Creator of ControlNet and Fooocus.", category: "AI", tags: ["Python", "AI"] },
  { username: "ggerganov", label: "Georgi Gerganov", tag: "llama.cpp", birthYear: 1990, country: "BGR", expectedAge: 74, description: "Creator of llama.cpp and whisper.cpp.", category: "AI", tags: ["C++", "AI"] },
  { username: "antirez", label: "Salvatore Sanfilippo", tag: "Redis", birthYear: 1977, country: "ITA", expectedAge: 84, description: "Creator of Redis.", category: "Backend", tags: ["C"] },
  { username: "gvanrossum", label: "Guido van Rossum", tag: "Python", birthYear: 1956, country: "USA", expectedAge: 83, description: "Creator of Python.", category: "Backend", tags: ["Python"] },
  { username: "ry", label: "Ryan Dahl", tag: "Node / Deno", birthYear: 1981, country: "USA", expectedAge: 76, description: "Creator of Node.js and Deno.", category: "Backend", tags: ["JavaScript", "TypeScript", "Rust"] },
  { username: "taylorotwell", label: "Taylor Otwell", tag: "Laravel", birthYear: 1985, country: "USA", expectedAge: 78, description: "Creator of Laravel.", category: "Backend", tags: ["PHP"] },
  { username: "BrendanEich", label: "Brendan Eich", tag: "JavaScript", birthYear: 1961, country: "USA", expectedAge: 78, description: "Created JavaScript in 10 days.", category: "Backend", tags: ["JavaScript"] },
  { username: "sindresorhus", label: "Sindre Sorhus", tag: "1000+ npm", birthYear: 1990, country: "NOR", expectedAge: 80, description: "1000+ npm packages.", category: "DevTools", tags: ["JavaScript"] },
  { username: "tj", label: "TJ Holowaychuk", tag: "Express.js", birthYear: 1988, country: "CAN", expectedAge: 79, description: "Creator of Express.js, Koa.", category: "DevTools", tags: ["JavaScript"] },
  { username: "defunkt", label: "Chris Wanstrath", tag: "GitHub", birthYear: 1985, country: "USA", expectedAge: 79, description: "Co-founder of GitHub.", category: "DevTools", tags: ["Ruby"] },
  { username: "mitchellh", label: "Mitchell Hashimoto", tag: "HashiCorp", birthYear: 1989, country: "USA", expectedAge: 78, description: "Co-founder of HashiCorp.", category: "DevTools", tags: ["Go"] },
  { username: "shykes", label: "Solomon Hykes", tag: "Docker", birthYear: 1983, country: "USA", expectedAge: 79, description: "Creator of Docker.", category: "DevTools", tags: ["Go", "Docker"] },
  { username: "evanw", label: "Evan Wallace", tag: "esbuild", birthYear: 1990, country: "USA", expectedAge: 77, description: "Co-founder of Figma. Creator of esbuild.", category: "DevTools", tags: ["JavaScript"] },
  { username: "sokra", label: "Tobias Koppers", tag: "webpack", birthYear: 1990, country: "DEU", expectedAge: 80, description: "Creator of webpack and Turbopack.", category: "DevTools", tags: ["JavaScript", "TypeScript"] },
  { username: "ThePrimeagen", label: "ThePrimeagen", tag: "Streamer", birthYear: 1986, country: "USA", expectedAge: 88, description: "Dev streamer, ex-Netflix engineer.", category: "Creators", tags: ["Rust", "Go", "TypeScript"] },
  { username: "kentcdodds", label: "Kent C. Dodds", tag: "Testing", birthYear: 1988, country: "USA", expectedAge: 90, description: "Testing guru. Creator of Testing Library.", category: "Creators", tags: ["JavaScript"] },
  { username: "rauchg", label: "Guillermo Rauch", tag: "Vercel", birthYear: 1990, country: "ARG", expectedAge: 75, description: "CEO of Vercel, creator of Socket.io.", category: "Creators", tags: ["JavaScript"] },
  { username: "codediodeio", label: "Jeff Delaney", tag: "Fireship", birthYear: 1990, country: "USA", expectedAge: 83, description: "Creator of Fireship.", category: "Creators", tags: ["JavaScript", "TypeScript"] },
  { username: "bradtraversy", label: "Brad Traversy", tag: "Traversy Media", birthYear: 1981, country: "USA", expectedAge: 77, description: "Traversy Media founder.", category: "Creators", tags: ["JavaScript"] },
  { username: "wesbos", label: "Wes Bos", tag: "Syntax.fm", birthYear: 1988, country: "CAN", expectedAge: 85, description: "Creator of JavaScript30, Syntax podcast.", category: "Creators", tags: ["JavaScript"] },
  { username: "t3dotgg", label: "Theo Browne", tag: "T3 Stack", birthYear: 1995, country: "USA", expectedAge: 78, description: "Creator of T3 Stack.", category: "Creators", tags: ["TypeScript", "React"] },
];

// ── Types ────────────────────────────────────────────────────────────────────

type SortKey = "commits" | "active" | "streak" | "best";

interface LeaderboardEntry {
  username: string;
  avatarUrl: string | null;
  label?: string;
  tag?: string;
  totalCommits: number;
  activeWeeks: number;
  currentStreak: number;
  longestStreak: number;
}

interface DevJsonData {
  username: string;
  createdAt: string;
  avatarUrl?: string;
  contributions: Record<number, ContributionWeek[]>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function flattenContributions(
  contribs: Record<number, ContributionWeek[]>,
): YearContribution[] {
  const result: YearContribution[] = [];
  for (const weeks of Object.values(contribs)) {
    for (const week of weeks) {
      result.push({ date: week.startDate, count: week.totalCommits });
    }
  }
  return result;
}

function computeDevStats(data: DevJsonData, birthYear: number, expectedAge: number) {
  const flat = flattenContributions(data.contributions);
  const weekMap = mapContributionsToWeeks(flat);
  const birthDate = new Date(birthYear, 0, 1);
  const githubCreated = new Date(data.createdAt);
  const cells = generateGridCells(birthDate, expectedAge, githubCreated, weekMap);
  const stats = calculateStats(cells);

  // Sum total commits from raw contribution data
  let totalCommits = 0;
  for (const weeks of Object.values(data.contributions)) {
    for (const week of weeks) {
      totalCommits += week.totalCommits;
    }
  }

  return { ...stats, totalCommits };
}

// ── Sort button ──────────────────────────────────────────────────────────────

function SortButton({
  sortKey,
  currentSort,
  onSort,
  children,
  icon: Icon,
}: {
  sortKey: SortKey;
  currentSort: SortKey;
  onSort: (key: SortKey) => void;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const active = sortKey === currentSort;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

// ── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      <div className="h-5 w-8 bg-muted rounded" />
      <div className="h-8 w-8 bg-muted rounded-full" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
      <div className="hidden sm:flex items-center gap-6">
        <div className="h-4 w-16 bg-muted rounded" />
        <div className="h-4 w-12 bg-muted rounded" />
        <div className="h-4 w-12 bg-muted rounded" />
        <div className="h-4 w-12 bg-muted rounded" />
      </div>
    </div>
  );
}

// ── Leaderboard row ──────────────────────────────────────────────────────────

function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
  sortKey,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
  sortKey: SortKey;
}) {
  const t = useTranslations("leaderboard");

  const rankDisplay = rank <= 3 ? (
    <span className={`text-lg font-bold ${
      rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : "text-amber-600"
    }`}>
      {rank === 1 ? "\u{1F947}" : rank === 2 ? "\u{1F948}" : "\u{1F949}"}
    </span>
  ) : (
    <span className="text-sm font-mono text-muted-foreground w-6 text-center">
      {rank}
    </span>
  );

  function highlightValue(key: SortKey, value: number) {
    const isHighlighted = key === sortKey;
    return (
      <span className={isHighlighted ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}>
        {value.toLocaleString()}
      </span>
    );
  }

  return (
    <Link
      href={`/demo?username=${encodeURIComponent(entry.username)}`}
      className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 ${
        isCurrentUser
          ? "bg-emerald-500/5 border-l-2 border-emerald-500"
          : "border-l-2 border-transparent"
      }`}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center shrink-0">
        {rankDisplay}
      </div>

      {/* Avatar */}
      <div className="shrink-0">
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.label || entry.username}
            className="h-8 w-8 rounded-full"
            loading="lazy"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
            {(entry.label || entry.username).slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name & username */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {entry.label || entry.username}
          </span>
          {entry.tag && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shrink-0 hidden sm:inline">
              {entry.tag}
            </span>
          )}
          {isCurrentUser && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
              {t("you")}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">@{entry.username}</span>
      </div>

      {/* Stats */}
      <div className="hidden sm:grid grid-cols-4 gap-6 text-right text-xs tabular-nums shrink-0">
        <div className="w-16">
          <div className="text-muted-foreground">{t("totalCommits")}</div>
          <div>{highlightValue("commits", entry.totalCommits)}</div>
        </div>
        <div className="w-14">
          <div className="text-muted-foreground">{t("activeWeeks")}</div>
          <div>{highlightValue("active", entry.activeWeeks)}</div>
        </div>
        <div className="w-14">
          <div className="text-muted-foreground">{t("currentStreak")}</div>
          <div>{highlightValue("streak", entry.currentStreak)}</div>
        </div>
        <div className="w-14">
          <div className="text-muted-foreground">{t("longestStreak")}</div>
          <div>{highlightValue("best", entry.longestStreak)}</div>
        </div>
      </div>

      {/* Mobile stats — only show sorted metric */}
      <div className="sm:hidden text-right text-xs tabular-nums shrink-0">
        <div className="text-muted-foreground">
          {sortKey === "commits" ? t("totalCommits") : sortKey === "active" ? t("activeWeeks") : sortKey === "streak" ? t("currentStreak") : t("longestStreak")}
        </div>
        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
          {(sortKey === "commits" ? entry.totalCommits : sortKey === "active" ? entry.activeWeeks : sortKey === "streak" ? entry.currentStreak : entry.longestStreak).toLocaleString()}
        </div>
      </div>
    </Link>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const { data: session } = useSession();

  const [sortKey, setSortKey] = useState<SortKey>("commits");
  const [famousEntries, setFamousEntries] = useState<LeaderboardEntry[]>([]);
  const [communityEntries, setCommunityEntries] = useState<LeaderboardEntry[]>([]);
  const [famousLoading, setFamousLoading] = useState(true);
  const [communityLoading, setCommunityLoading] = useState(true);

  // Current user's GitHub username (from session image URL or name)
  const currentUsername = session?.user?.name?.toLowerCase() ?? "";

  // Load famous devs from static JSON
  useEffect(() => {
    let cancelled = false;

    async function loadFamousDevs() {
      const entries: LeaderboardEntry[] = [];

      const results = await Promise.allSettled(
        FAMOUS_DEVS.map(async (dev) => {
          const res = await fetch(`/data/devs/${encodeURIComponent(dev.username)}.json`);
          if (!res.ok) return null;
          const data: DevJsonData = await res.json();
          const stats = computeDevStats(data, dev.birthYear, dev.expectedAge);
          return {
            username: dev.username,
            avatarUrl: data.avatarUrl ?? null,
            label: dev.label,
            tag: dev.tag,
            totalCommits: stats.totalCommits,
            activeWeeks: stats.activeWeeks,
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
          } satisfies LeaderboardEntry;
        }),
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          entries.push(result.value);
        }
      }

      if (!cancelled) {
        setFamousEntries(entries);
        setFamousLoading(false);
      }
    }

    loadFamousDevs();
    return () => { cancelled = true; };
  }, []);

  // Load community users from API
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/leaderboard?sort=${sortKey}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setCommunityEntries(
            data.map((u: {
              githubId: string;
              username: string;
              avatarUrl: string | null;
              totalCommits: number;
              activeWeeks: number;
              currentStreak: number;
              longestStreak: number;
            }) => ({
              username: u.username,
              avatarUrl: u.avatarUrl,
              totalCommits: u.totalCommits,
              activeWeeks: u.activeWeeks,
              currentStreak: u.currentStreak,
              longestStreak: u.longestStreak,
            })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setCommunityEntries([]);
      })
      .finally(() => {
        if (!cancelled) setCommunityLoading(false);
      });

    return () => { cancelled = true; };
  }, [sortKey]);

  // Sort famous devs client-side
  const sortedFamous = useMemo(() => {
    const sorted = [...famousEntries];
    switch (sortKey) {
      case "active":
        sorted.sort((a, b) => b.activeWeeks - a.activeWeeks);
        break;
      case "streak":
        sorted.sort((a, b) => b.currentStreak - a.currentStreak);
        break;
      case "best":
        sorted.sort((a, b) => b.longestStreak - a.longestStreak);
        break;
      case "commits":
      default:
        sorted.sort((a, b) => b.totalCommits - a.totalCommits);
        break;
    }
    return sorted;
  }, [famousEntries, sortKey]);

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto p-6 flex flex-col space-y-8 max-w-4xl">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-emerald-500" />
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">{t("sortBy")}:</span>
          <SortButton sortKey="commits" currentSort={sortKey} onSort={setSortKey} icon={Zap}>
            {t("totalCommits")}
          </SortButton>
          <SortButton sortKey="active" currentSort={sortKey} onSort={setSortKey} icon={Calendar}>
            {t("activeWeeks")}
          </SortButton>
          <SortButton sortKey="streak" currentSort={sortKey} onSort={setSortKey} icon={Flame}>
            {t("currentStreak")}
          </SortButton>
          <SortButton sortKey="best" currentSort={sortKey} onSort={setSortKey} icon={Crown}>
            {t("longestStreak")}
          </SortButton>
        </div>

        {/* Famous Devs section */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            {t("famousDevs")}
          </h2>
          <div className="rounded-lg border border-border bg-card/50 overflow-hidden divide-y divide-border">
            {famousLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : sortedFamous.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No data available
              </div>
            ) : (
              sortedFamous.map((entry, idx) => (
                <LeaderboardRow
                  key={entry.username}
                  entry={entry}
                  rank={idx + 1}
                  isCurrentUser={false}
                  sortKey={sortKey}
                />
              ))
            )}
          </div>
        </section>

        {/* Community section */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            {t("community")}
          </h2>
          <div className="rounded-lg border border-border bg-card/50 overflow-hidden divide-y divide-border">
            {communityLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : communityEntries.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No community members yet. Sign in and sync your contributions to appear here!
              </div>
            ) : (
              communityEntries.map((entry, idx) => (
                <LeaderboardRow
                  key={entry.username}
                  entry={entry}
                  rank={idx + 1}
                  isCurrentUser={entry.username.toLowerCase() === currentUsername}
                  sortKey={sortKey}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}
