"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LifeGrid } from "@/components/life-grid";
import { StickyStatsBar } from "@/components/sticky-stats-bar";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import * as Flags from "country-flag-icons/react/3x2";
import Link from "next/link";
import {
  generateGridCells,
  mapContributionsToWeeks,
  calculateStats,
} from "@/lib/grid-utils";
import { StatsPanel } from "@/components/stats-panel";
import type { ContributionWeek, YearContribution } from "@/lib/types";

const DEFAULT_EXPECTED_AGE = 80;

const COUNTRY_TO_ISO2: Record<string, string> = {
  "USA": "US", "UK": "GB", "China": "CN", "France": "FR", "Italy": "IT",
  "Germany": "DE", "Canada": "CA", "Norway": "NO", "Bulgaria": "BG",
  "China/USA": "CN", "UK/USA": "GB", "Russia/UK": "RU", "Finland/USA": "FI",
  "Slovakia/USA": "SK", "France/USA": "FR", "Argentina/USA": "AR",
  "Norway/Thailand": "NO", "Netherlands/USA": "NL",
};

function CountryFlag({ country }: { country: string }) {
  const iso2 = COUNTRY_TO_ISO2[country];
  if (!iso2) return <span className="text-xs">{country}</span>;
  const Flag = (Flags as Record<string, React.ComponentType<{ className?: string }>>)[iso2];
  if (!Flag) return <span className="text-xs">{country}</span>;
  return <Flag className="h-3 w-4 inline-block" />;
}

// Known dev data — used when viewing a famous dev's grid
const KNOWN_DEVS: Record<string, { birthYear: number; country: string; expectedAge: number; label: string }> = {
  yyx990803: { birthYear: 1987, country: "China/USA", expectedAge: 80, label: "Evan You — Creator of Vue.js & Vite" },
  "rich-harris": { birthYear: 1985, country: "UK/USA", expectedAge: 79, label: "Rich Harris — Creator of Svelte & SvelteKit" },
  gaearon: { birthYear: 1992, country: "Russia/UK", expectedAge: 80, label: "Dan Abramov — Co-creator of Redux, React core" },
  addyosmani: { birthYear: 1986, country: "UK/USA", expectedAge: 79, label: "Addy Osmani — Engineering Lead at Google Chrome" },
  tannerlinsley: { birthYear: 1991, country: "USA", expectedAge: 79, label: "Tanner Linsley — Creator of TanStack" },
  sebmck: { birthYear: 1994, country: "UK", expectedAge: 73, label: "Sebastian McKenzie — Creator of Babel & Biome" },
  torvalds: { birthYear: 1969, country: "Finland/USA", expectedAge: 82, label: "Linus Torvalds — Creator of Linux & Git" },
  bellard: { birthYear: 1972, country: "France", expectedAge: 84, label: "Fabrice Bellard — Creator of FFmpeg, QEMU, QuickJS" },
  karpathy: { birthYear: 1986, country: "Slovakia/USA", expectedAge: 87, label: "Andrej Karpathy — Ex-Tesla AI, OpenAI founder" },
  lllyasviel: { birthYear: 1995, country: "China", expectedAge: 75, label: "Lvmin Zhang — Creator of ControlNet & Fooocus" },
  ggerganov: { birthYear: 1990, country: "Bulgaria", expectedAge: 74, label: "Georgi Gerganov — Creator of llama.cpp & GGML" },
  antirez: { birthYear: 1977, country: "Italy", expectedAge: 84, label: "Salvatore Sanfilippo — Creator of Redis" },
  gvanrossum: { birthYear: 1956, country: "Netherlands/USA", expectedAge: 83, label: "Guido van Rossum — Creator of Python" },
  ry: { birthYear: 1981, country: "USA", expectedAge: 76, label: "Ryan Dahl — Creator of Node.js & Deno" },
  taylorotwell: { birthYear: 1985, country: "USA", expectedAge: 78, label: "Taylor Otwell — Creator of Laravel" },
  BrendanEich: { birthYear: 1961, country: "USA", expectedAge: 78, label: "Brendan Eich — Creator of JavaScript, CEO of Brave" },
  sindresorhus: { birthYear: 1990, country: "Norway/Thailand", expectedAge: 80, label: "Sindre Sorhus — 1000+ npm packages" },
  tj: { birthYear: 1988, country: "Canada", expectedAge: 79, label: "TJ Holowaychuk — Creator of Express.js & Koa" },
  defunkt: { birthYear: 1985, country: "USA", expectedAge: 79, label: "Chris Wanstrath — Co-founder of GitHub" },
  mitchellh: { birthYear: 1989, country: "USA", expectedAge: 78, label: "Mitchell Hashimoto — Co-founder of HashiCorp" },
  shykes: { birthYear: 1983, country: "France/USA", expectedAge: 79, label: "Solomon Hykes — Creator of Docker" },
  evanw: { birthYear: 1990, country: "USA", expectedAge: 77, label: "Evan Wallace — Co-founder of Figma, Creator of esbuild" },
  sokra: { birthYear: 1990, country: "Germany", expectedAge: 80, label: "Tobias Koppers — Creator of webpack & Turbopack" },
  ThePrimeagen: { birthYear: 1986, country: "USA", expectedAge: 88, label: "ThePrimeagen — Dev streamer, ex-Netflix" },
  kentcdodds: { birthYear: 1988, country: "USA", expectedAge: 90, label: "Kent C. Dodds — Testing Library, Epic React" },
  rauchg: { birthYear: 1990, country: "Argentina/USA", expectedAge: 75, label: "Guillermo Rauch — CEO of Vercel" },
  codediodeio: { birthYear: 1990, country: "USA", expectedAge: 83, label: "Jeff Delaney — Creator of Fireship" },
  bradtraversy: { birthYear: 1981, country: "USA", expectedAge: 77, label: "Brad Traversy — Traversy Media founder" },
  wesbos: { birthYear: 1988, country: "Canada", expectedAge: 85, label: "Wes Bos — JavaScript30, Syntax podcast" },
  t3dotgg: { birthYear: 1995, country: "USA", expectedAge: 78, label: "Theo Browne — Creator of T3 Stack" },
};

interface DemoData {
  username: string;
  createdAt: string;
  avatarUrl?: string;
  contributions: Record<number, ContributionWeek[]>;
  birthDate?: string;
  expectedAge?: number;
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
  const tdb = useTranslations("dashboard");
  const initialUsername = searchParams.get("username") || "";

  const [username, setUsername] = useState(initialUsername);
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMiniBar, setShowMiniBar] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  // Show compact bar based on scroll position — using rAF for smooth updates
  useEffect(() => {
    let ticking = false;
    function handleScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (infoRef.current) {
          const rect = infoRef.current.getBoundingClientRect();
          setShowMiniBar(rect.top < -20);
        }
        ticking = false;
      });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // check initial state
    return () => window.removeEventListener("scroll", handleScroll);
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
  const birthYear = knownDev?.birthYear
    ?? (data?.birthDate ? new Date(data.birthDate).getFullYear() : null)
    ?? (data ? new Date(data.createdAt).getFullYear() - 25 : 1990);
  const expectedAge = knownDev?.expectedAge ?? data?.expectedAge ?? DEFAULT_EXPECTED_AGE;

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
            <StickyStatsBar
              show={showMiniBar}
              stats={stats}
              name={knownDev?.label || data.username}
              avatarUrl={data.avatarUrl}
              githubUsername={data.username}
              weeksLabel={td("weeks")}
              activeLabel={tdb("activeWeeks")}
              streakLabel={tdb("currentStreak")}
              bestLabel={tdb("longestStreak")}
            />

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
                <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-muted-foreground">
                  <a
                    href={`https://github.com/${data.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                    @{data.username}
                  </a>
                  {knownDev && (
                    <>
                      <span className="flex items-center gap-1.5">
                        <CountryFlag country={knownDev.country} />
                        {knownDev.country}
                      </span>
                      <span>{age} {td("yearsOld")}</span>
                    </>
                  )}
                  <span>{td("githubSince")} {new Date(data.createdAt).getFullYear()}</span>
                  <span>{td("lifeExpectancy")}: {expectedAge} {td("yearsOld")}</span>
                </div>
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
