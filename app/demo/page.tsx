"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LifeGrid } from "@/components/life-grid";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import {
  generateGridCells,
  mapContributionsToWeeks,
  calculateStats,
} from "@/lib/grid-utils";
import { StatsPanel } from "@/components/stats-panel";
import type { ContributionWeek, YearContribution } from "@/lib/types";

const DEFAULT_EXPECTED_AGE = 80;

// Known dev data — used when viewing a famous dev's grid
const KNOWN_DEVS: Record<string, { birthYear: number; country: string; expectedAge: number; label: string }> = {
  torvalds: { birthYear: 1969, country: "Finland/USA", expectedAge: 80, label: "Linus Torvalds — Creator of Linux & Git" },
  yyx990803: { birthYear: 1990, country: "China/USA", expectedAge: 82, label: "Evan You — Creator of Vue.js & Vite" },
  rauchg: { birthYear: 1990, country: "Argentina/USA", expectedAge: 80, label: "Guillermo Rauch — CEO of Vercel, creator of Socket.io" },
  sindresorhus: { birthYear: 1990, country: "Norway/Thailand", expectedAge: 84, label: "Sindre Sorhus — 1000+ npm packages, macOS apps" },
  tj: { birthYear: 1988, country: "Canada", expectedAge: 82, label: "TJ Holowaychuk — Express.js, Koa, Co, Apex" },
  addyosmani: { birthYear: 1985, country: "UK/USA", expectedAge: 80, label: "Addy Osmani — Engineering Lead at Google Chrome" },
  ThePrimeagen: { birthYear: 1988, country: "USA", expectedAge: 78, label: "ThePrimeagen — Netflix engineer, content creator" },
  antirez: { birthYear: 1977, country: "Italy", expectedAge: 83, label: "Salvatore Sanfilippo — Creator of Redis" },
  defunkt: { birthYear: 1985, country: "USA", expectedAge: 80, label: "Chris Wanstrath — Co-founder & former CEO of GitHub" },
  mitchellh: { birthYear: 1990, country: "USA", expectedAge: 80, label: "Mitchell Hashimoto — Co-founder of HashiCorp, creator of Vagrant, Terraform" },
  "rich-harris": { birthYear: 1985, country: "UK/USA", expectedAge: 81, label: "Rich Harris — Creator of Svelte, works at Vercel" },
  "dan-abramov": { birthYear: 1992, country: "Russia/UK", expectedAge: 81, label: "Dan Abramov — Co-creator of Redux, React team at Meta" },
  kentcdodds: { birthYear: 1990, country: "USA", expectedAge: 78, label: "Kent C. Dodds — Testing Library, educator" },
  tannerlinsley: { birthYear: 1990, country: "USA", expectedAge: 80, label: "Tanner Linsley — Creator of TanStack (React Query, Router, Table)" },
};

interface DemoData {
  username: string;
  createdAt: string;
  avatarUrl?: string;
  contributions: Record<number, ContributionWeek[]>;
}

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

function DemoPageContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("landing");
  const td = useTranslations("demo");
  const initialUsername = searchParams.get("username") || "";

  const [username, setUsername] = useState(initialUsername);
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMiniBar, setShowMiniBar] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  // Show compact bar when full info scrolls out
  useEffect(() => {
    if (!infoRef.current) return;
    const obs = new IntersectionObserver(([e]) => setShowMiniBar(!e.isIntersecting), { threshold: 0 });
    obs.observe(infoRef.current);
    return () => obs.disconnect();
  }, [data]);

  const fetchDemo = useCallback(async (user: string) => {
    if (!user.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(
        `/api/demo?username=${encodeURIComponent(user.trim())}`,
      );
      if (!res.ok) throw new Error("not found");
      const json = await res.json();
      setData(json);
    } catch {
      setError(t("demoError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Auto-fetch if username is in URL
  useEffect(() => {
    if (initialUsername) {
      fetchDemo(initialUsername);
    }
  }, [initialUsername, fetchDemo]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchDemo(username);
  }

  // Also try loading from static JSON first for known devs
  useEffect(() => {
    if (!initialUsername) return;
    fetch(`/data/devs/${encodeURIComponent(initialUsername)}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && !data) setData(json);
      })
      .catch(() => {});
  }, [initialUsername]); // eslint-disable-line react-hooks/exhaustive-deps

  const knownDev = KNOWN_DEVS[initialUsername] || null;
  const birthYear = knownDev?.birthYear ?? (data ? new Date(data.createdAt).getFullYear() - 25 : 1990);
  const expectedAge = knownDev?.expectedAge ?? DEFAULT_EXPECTED_AGE;

  const birthDate = useMemo(() => new Date(birthYear, 0, 1), [birthYear]);
  const githubCreated = useMemo(
    () => (data ? new Date(data.createdAt) : new Date()),
    [data],
  );
  const flat = useMemo(
    () => (data ? flattenContributions(data.contributions) : []),
    [data],
  );
  const weekMap = useMemo(() => mapContributionsToWeeks(flat), [flat]);

  const cells = useMemo(() => {
    if (!data) return [];
    return generateGridCells(
      birthDate,
      expectedAge,
      githubCreated,
      weekMap,
    );
  }, [data, birthDate, expectedAge, githubCreated, weekMap]);

  const stats = useMemo(() => calculateStats(cells), [cells]);

  const age = new Date().getFullYear() - birthYear;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {td("backToHome")}
        </Link>

        {loading && (
          <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
            {/* Avatar + name skeleton */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-5 w-40 rounded bg-muted" />
                <div className="h-3 w-64 rounded bg-muted" />
              </div>
            </div>
            {/* Progress bar skeleton */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-3 w-28 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted" />
            </div>
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-5">
                  <div className="h-3 w-20 rounded bg-muted mb-2" />
                  <div className="h-7 w-28 rounded bg-muted" />
                </div>
              ))}
            </div>
            {/* Grid skeleton */}
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <LifeGrid cells={[]} expectedAge={80} loading={true} />
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-destructive py-4">{error}</div>
        )}

        {data && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Sticky compact bar — only visible when full stats scroll out */}
            {showMiniBar && (
              <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  {data.avatarUrl && (
                    <img src={data.avatarUrl} alt="" className="h-7 w-7 rounded-full shrink-0" />
                  )}
                  <span className="text-sm font-semibold truncate">{knownDev?.label || data.username}</span>
                  <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground tabular-nums shrink-0">
                    <span className="font-semibold text-foreground text-sm">{stats.percentLived}%</span>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden w-20">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.percentLived}%` }} />
                    </div>
                    <span>{stats.weeksLived.toLocaleString()}/{stats.weeksTotal.toLocaleString()}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{stats.activeWeeks} active</span>
                    <span>{stats.currentStreak}w streak</span>
                    <span>{stats.longestStreak}w best</span>
                  </div>
                </div>
              </div>
            )}

            {/* Dev info — observed for sticky bar visibility */}
            <div ref={infoRef} className="flex items-center gap-4">
              {data.avatarUrl && (
                <img
                  src={data.avatarUrl}
                  alt={data.username}
                  className="h-14 w-14 rounded-full border-2 border-primary/30"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {knownDev?.label || data.username}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {knownDev ? `${knownDev.country} · ${age} ${td("yearsOld")} · ` : ""}
                  {td("githubSince")} {new Date(data.createdAt).getFullYear()} · {td("lifeExpectancy")}: {expectedAge} {td("yearsOld")}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
                <span>{stats.percentLived}% {td("lifeLived")}</span>
                <span>{stats.weeksLived.toLocaleString()} / {stats.weeksTotal.toLocaleString()} {td("weeks")}</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(stats.percentLived, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <StatsPanel stats={stats} />

            {/* Grid */}
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <LifeGrid cells={cells} expectedAge={expectedAge} loading={loading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <DemoPageContent />
    </Suspense>
  );
}
