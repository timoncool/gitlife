"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SignInButton } from "@/components/sign-in-button";
import { useSession } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Search, Globe, ExternalLink, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Header } from "@/components/header";
import { MiniLifeGrid } from "@/components/mini-life-grid";
import {
  generateGridCells,
  mapContributionsToWeeks,
  calculateStats,
} from "@/lib/grid-utils";
import type { ContributionWeek, YearContribution } from "@/lib/types";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

import * as Flags from "country-flag-icons/react/3x2";

const LANGUAGES = [
  { value: "en", label: "English", flagCode: "US" },
  { value: "zh", label: "中文", flagCode: "CN" },
  { value: "es", label: "Español", flagCode: "ES" },
  { value: "pt", label: "Português", flagCode: "BR" },
  { value: "ru", label: "Русский", flagCode: "RU" },
  { value: "de", label: "Deutsch", flagCode: "DE" },
  { value: "ja", label: "日本語", flagCode: "JP" },
] as const;

function FlagIcon({ code, className }: { code: string; className?: string }) {
  const Flag = (Flags as Record<string, React.ComponentType<{ className?: string }>>)[code];
  if (!Flag) return null;
  return <Flag className={className || "h-3 w-4 inline-block"} />;
}

// Public data from Wikipedia, interviews, public profiles
type DevCategory = "Frontend" | "Backend" | "DevTools" | "Creators";

const FAMOUS_DEVS: {
  username: string; label: string; tag: string; birthYear: number;
  country: string; expectedAge: number; description: string; category: DevCategory;
}[] = [
  // Frontend
  { username: "yyx990803", label: "Evan You", tag: "Vue.js", birthYear: 1987, country: "USA", expectedAge: 78, description: "Creator of Vue.js and Vite. One of the most popular JS frameworks.", category: "Frontend" },
  { username: "rich-harris", label: "Rich Harris", tag: "Svelte", birthYear: 1985, country: "USA", expectedAge: 78, description: "Creator of Svelte and SvelteKit. Rethinking frontend frameworks.", category: "Frontend" },
  { username: "gaearon", label: "Dan Abramov", tag: "React", birthYear: 1992, country: "GBR", expectedAge: 81, description: "Co-creator of Redux, React core team. Born in Russia, lives in London.", category: "Frontend" },
  { username: "addyosmani", label: "Addy Osmani", tag: "Chrome", birthYear: 1986, country: "USA", expectedAge: 78, description: "Engineering lead on Google Chrome. Web performance expert.", category: "Frontend" },
  { username: "tannerlinsley", label: "Tanner Linsley", tag: "TanStack", birthYear: 1991, country: "USA", expectedAge: 78, description: "Creator of TanStack Query, Table, Router. Full-stack open source.", category: "Frontend" },
  { username: "sebmck", label: "Sebastian McKenzie", tag: "Babel", birthYear: 1994, country: "GBR", expectedAge: 81, description: "Creator of Babel and Biome. Transformed modern JavaScript tooling.", category: "Frontend" },
  // Backend
  { username: "torvalds", label: "Linus Torvalds", tag: "Linux", birthYear: 1969, country: "USA", expectedAge: 78, description: "Creator of Linux and Git. Changed the world of open source.", category: "Backend" },
  { username: "antirez", label: "Salvatore Sanfilippo", tag: "Redis", birthYear: 1977, country: "ITA", expectedAge: 83, description: "Creator of Redis — the most popular in-memory database.", category: "Backend" },
  { username: "gvanrossum", label: "Guido van Rossum", tag: "Python", birthYear: 1956, country: "USA", expectedAge: 78, description: "Creator of Python. Benevolent Dictator For Life.", category: "Backend" },
  { username: "ry", label: "Ryan Dahl", tag: "Node / Deno", birthYear: 1981, country: "USA", expectedAge: 78, description: "Creator of Node.js and Deno. Redefined server-side JS twice.", category: "Backend" },
  { username: "taylorotwell", label: "Taylor Otwell", tag: "Laravel", birthYear: 1985, country: "USA", expectedAge: 78, description: "Creator of Laravel. Single-handedly revived PHP.", category: "Backend" },
  { username: "BrendanEich", label: "Brendan Eich", tag: "JavaScript", birthYear: 1961, country: "USA", expectedAge: 78, description: "Created JavaScript in 10 days. CEO of Brave browser.", category: "Backend" },
  { username: "bellard", label: "Fabrice Bellard", tag: "FFmpeg / QEMU", birthYear: 1972, country: "FRA", expectedAge: 83, description: "Creator of FFmpeg, QEMU, QuickJS. Most productive programmer alive.", category: "Backend" },
  // DevTools
  { username: "sindresorhus", label: "Sindre Sorhus", tag: "1000+ npm", birthYear: 1990, country: "NOR", expectedAge: 84, description: "Mass producer of open source. 1000+ npm packages.", category: "DevTools" },
  { username: "tj", label: "TJ Holowaychuk", tag: "Express.js", birthYear: 1988, country: "CAN", expectedAge: 82, description: "Creator of Express.js, Koa, and dozens of Node.js tools.", category: "DevTools" },
  { username: "defunkt", label: "Chris Wanstrath", tag: "GitHub", birthYear: 1985, country: "USA", expectedAge: 78, description: "Co-founder of GitHub. Changed how software is built.", category: "DevTools" },
  { username: "mitchellh", label: "Mitchell Hashimoto", tag: "HashiCorp", birthYear: 1989, country: "USA", expectedAge: 78, description: "Co-founder of HashiCorp. Creator of Terraform and Vault.", category: "DevTools" },
  { username: "shykes", label: "Solomon Hykes", tag: "Docker", birthYear: 1983, country: "USA", expectedAge: 78, description: "Creator of Docker. Containerized the entire industry.", category: "DevTools" },
  { username: "evanw", label: "Evan Wallace", tag: "esbuild", birthYear: 1990, country: "USA", expectedAge: 78, description: "Co-founder of Figma. Creator of esbuild — fastest JS bundler.", category: "DevTools" },
  { username: "sokra", label: "Tobias Koppers", tag: "webpack", birthYear: 1990, country: "DEU", expectedAge: 81, description: "Creator of webpack and Turbopack. Bundled the modern web.", category: "DevTools" },
  // Creators
  { username: "ThePrimeagen", label: "ThePrimeagen", tag: "Streamer", birthYear: 1986, country: "USA", expectedAge: 78, description: "Dev streamer and content creator. Ex-Netflix engineer.", category: "Creators" },
  { username: "kentcdodds", label: "Kent C. Dodds", tag: "Testing", birthYear: 1988, country: "USA", expectedAge: 78, description: "Testing guru. Creator of Testing Library and Epic React.", category: "Creators" },
  { username: "rauchg", label: "Guillermo Rauch", tag: "Vercel", birthYear: 1990, country: "ARG", expectedAge: 77, description: "CEO of Vercel, creator of Socket.io. Next.js visionary.", category: "Creators" },
  { username: "codediodeio", label: "Jeff Delaney", tag: "Fireship", birthYear: 1990, country: "USA", expectedAge: 78, description: "Creator of Fireship. Complex topics in 100 seconds.", category: "Creators" },
  { username: "bradtraversy", label: "Brad Traversy", tag: "Traversy Media", birthYear: 1981, country: "USA", expectedAge: 78, description: "Traversy Media founder. Taught millions to code.", category: "Creators" },
  { username: "wesbos", label: "Wes Bos", tag: "Syntax.fm", birthYear: 1988, country: "CAN", expectedAge: 82, description: "Creator of JavaScript30, Syntax podcast. Web dev educator.", category: "Creators" },
  { username: "t3dotgg", label: "Theo Browne", tag: "T3 Stack", birthYear: 1995, country: "USA", expectedAge: 78, description: "Creator of T3 Stack. YouTuber and CEO of T3 Chat.", category: "Creators" },
];

const DEFAULT_EXPECTED_AGE = 80;

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

function DemoMiniGrid({
  data,
  birthYear,
  expectedAge = DEFAULT_EXPECTED_AGE,
  showStats = false,
}: {
  data: DemoData;
  birthYear: number;
  expectedAge?: number;
  showStats?: boolean;
}) {
  const birthDate = useMemo(() => new Date(birthYear, 0, 1), [birthYear]);
  const githubCreated = useMemo(() => new Date(data.createdAt), [data.createdAt]);
  const flat = useMemo(() => flattenContributions(data.contributions), [data]);
  const weekMap = useMemo(() => mapContributionsToWeeks(flat), [flat]);

  const cells = useMemo(() => {
    return generateGridCells(
      birthDate,
      expectedAge,
      githubCreated,
      weekMap,
    );
  }, [birthDate, expectedAge, githubCreated, weekMap]);

  const t = useTranslations("dashboard");
  const stats = useMemo(() => calculateStats(cells), [cells]);
  const commitPercent = stats.weeksLived > 0
    ? Math.round((stats.activeWeeks / stats.weeksLived) * 1000) / 10
    : 0;

  return (
    <div>
      <MiniLifeGrid cells={cells} expectedAge={expectedAge} />
      {showStats && (
        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground font-mono tabular-nums">
          <span>{stats.weeksLived}/{stats.weeksTotal} {t("wksCompact")}</span>
          <span className="text-emerald-600 dark:text-emerald-400">{stats.activeWeeks} {t("active")}</span>
          <span>{commitPercent}% {t("coded")}</span>
        </div>
      )}
    </div>
  );
}

function WhatIsThisSection() {
  const t = useTranslations("landing");

  const features = [
    { icon: "\u{1F4CA}", title: t("featureVisualization"), desc: t("featureVisualizationDesc") },
    { icon: "\u{1F49A}", title: t("featureGithub"), desc: t("featureGithubDesc") },
    { icon: "\u{1F9EE}", title: t("featureCalculator"), desc: t("featureCalculatorDesc") },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-4">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">{t("whatIsThisTitle")}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-2 leading-relaxed">{t("whatIsThisDesc1")}</p>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">{t("whatIsThisDesc2")}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border bg-card/50 backdrop-blur-sm p-6 text-center flex flex-col items-center gap-3">
            <span className="text-3xl">{f.icon}</span>
            <h3 className="font-semibold text-lg">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DemoSection() {
  const t = useTranslations("landing");
  const [username, setUsername] = useState("");
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDemo = useCallback(async (user: string) => {
    if (!user.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(
        `/api/demo?username=${encodeURIComponent(user.trim())}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json?.username || !json?.contributions) {
        throw new Error("Invalid response format");
      }
      setData(json);
    } catch (err) {
      console.error("Demo fetch error:", err);
      setError(t("demoError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchDemo(username);
  }

  // Estimate birth year from GitHub created date (rough guess: joined at ~25)
  const birthYear = data
    ? new Date(data.createdAt).getFullYear() - 25
    : 1990;

  return (
    <section className="w-full max-w-5xl mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">{t("demoTitle")}</h2>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex gap-3 max-w-md mx-auto mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("demoPlaceholder")}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading || !username.trim()}>
          {loading ? (
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <>
              {t("demoButton")}
              <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {loading && (
        <div className="text-center text-muted-foreground animate-pulse py-8">
          {t("demoLoading")}
        </div>
      )}

      {error && (
        <div className="text-center text-destructive py-4">{error}</div>
      )}

      {data && (
        <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <GitHubIcon className="h-5 w-5" />
            <span className="font-semibold text-lg">{data.username}</span>
          </div>
          <DemoMiniGrid data={data} birthYear={birthYear} />
        </div>
      )}
    </section>
  );
}

function FamousDevCard({
  dev,
}: {
  dev: (typeof FAMOUS_DEVS)[number];
}) {
  const t = useTranslations("landing");
  const td = useTranslations("dashboard");
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!ref.current || fetched.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetched.current) {
          fetched.current = true;
          // 1. Try cache first (instant)
          fetch(`/data/devs/${encodeURIComponent(dev.username)}.json`)
            .then((res) => {
              if (res.ok) return res.json();
              return null;
            })
            .then((cached) => {
              if (cached) {
                setData(cached);
                setLoading(false);
              } else {
                // 2. No cache — fetch from API
                setLoading(true);
                fetch(`/api/demo?username=${encodeURIComponent(dev.username)}`)
                  .then(r => r.ok ? r.json() : null)
                  .then(json => { if (json) setData(json); })
                  .finally(() => setLoading(false));
              }
            });
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [dev.username]);

  const currentAge = new Date().getFullYear() - dev.birthYear;
  const avatarUrl = data?.avatarUrl;

  return (
    <div ref={ref} className="group rounded-lg border bg-card/50 backdrop-blur-sm p-5 flex flex-col gap-3 transition-all hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={dev.label}
            className="h-7 w-7 rounded-full"
            loading="lazy"
          />
        ) : (
          <GitHubIcon className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{dev.label}</span>
            <span className="text-xs text-muted-foreground shrink-0">{currentAge} {t("age")}</span>
          </div>
          <span className="text-xs text-muted-foreground">@{dev.username}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            {dev.tag}
          </span>
          <a
            href={`https://github.com/${dev.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label={`${dev.label} on GitHub`}
          >
            <GitHubIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
      {dev.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{dev.description}</p>
      )}
      <Link href={`/demo?username=${encodeURIComponent(dev.username)}`} className="flex flex-col gap-3 cursor-pointer">
        {data ? (
          <div className="animate-fade-in">
            <DemoMiniGrid
              data={data}
              birthYear={dev.birthYear}
              expectedAge={dev.expectedAge}
              showStats
            />
          </div>
        ) : (
          <div className="animate-pulse">
            <div
              className="w-full rounded bg-muted"
              style={{ aspectRatio: `${52} / ${dev.expectedAge}` }}
            />
            <div className="flex items-center gap-3 mt-2">
              <div className="h-2.5 w-16 rounded bg-muted" />
              <div className="h-2.5 w-12 rounded bg-muted" />
              <div className="h-2.5 w-14 rounded bg-muted" />
            </div>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          <span>{t("viewGrid")}</span>
          <ExternalLink className="h-3 w-3" />
        </div>
      </Link>
    </div>
  );
}

function ColorLegend() {
  const t = useTranslations("landing");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const items = isDark ? [
    { color: "#0d1117", border: true, borderColor: "rgba(255,255,255,0.1)", label: t("legendFuture") },
    { color: "#0d1117", border: false, label: t("legendPreGithub") },
    { color: "#21262d", border: false, label: t("legendNoCommits") },
    { color: "#0e4429", border: false, label: t("legendLow") },
    { color: "#26a641", border: false, label: t("legendMedium") },
    { color: "#39d353", border: false, label: t("legendHigh") },
    { color: "rgba(57,211,83,0.3)", border: true, borderColor: "#39D353", label: t("legendCurrent") },
  ] : [
    { color: "#f6f8fa", border: true, borderColor: "#d0d7de", label: t("legendFuture") },
    { color: "#f6f8fa", border: false, label: t("legendPreGithub") },
    { color: "#ebedf0", border: false, label: t("legendNoCommits") },
    { color: "#9be9a8", border: false, label: t("legendLow") },
    { color: "#40c463", border: false, label: t("legendMedium") },
    { color: "#216e39", border: false, label: t("legendHigh") },
    { color: "rgba(225,111,36,0.2)", border: true, borderColor: "#e16f24", label: t("legendCurrent") },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-10 text-xs text-muted-foreground">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm shrink-0"
            style={{
              backgroundColor: item.color,
              border: item.border ? `1.5px solid ${item.borderColor}` : "none",
            }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

const CATEGORIES: (DevCategory | "All")[] = ["All", "Frontend", "Backend", "DevTools", "Creators"];
const CATEGORY_KEYS: Record<DevCategory | "All", string> = {
  All: "catAll", Frontend: "catFrontend", Backend: "catBackend", DevTools: "catDevtools", Creators: "catCreators",
};

function FamousDevsSection() {
  const t = useTranslations("landing");
  const td = useTranslations("dashboard");
  const [category, setCategory] = useState<DevCategory | "All">("All");

  const filteredDevs = category === "All"
    ? FAMOUS_DEVS
    : FAMOUS_DEVS.filter(d => d.category === category);

  return (
    <section className="w-full max-w-7xl mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
          {t("famousTitle")}
        </h2>
        <p className="text-muted-foreground">{t("famousSubtitle")}</p>
      </div>

      {/* Category tabs */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
              category === cat
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {td(CATEGORY_KEYS[cat])}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevs.map((dev, i) => (
          <div key={dev.username} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <FamousDevCard dev={dev} />
          </div>
        ))}
      </div>
      <ColorLegend />
    </section>
  );
}

const ALLOWED_LOCALES = LANGUAGES.map((l) => l.value);

function LanguageFooterSelector() {
  const currentLocale =
    typeof document !== "undefined"
      ? (document.documentElement.lang || "en")
      : "en";

  function handleChange(value: string | null) {
    if (!value || !ALLOWED_LOCALES.includes(value as typeof ALLOWED_LOCALES[number])) return;
    document.cookie = `locale=${value};path=/;max-age=31536000;SameSite=Lax`;
    window.location.reload();
  }

  return (
    <Select defaultValue={currentLocale} onValueChange={handleChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue>
          {(() => {
            const lang = LANGUAGES.find(l => l.value === currentLocale);
            if (!lang) return currentLocale;
            return <span className="flex items-center gap-2"><FlagIcon code={lang.flagCode} />{lang.label}</span>;
          })()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            <span className="flex items-center gap-2"><FlagIcon code={lang.flagCode} />{lang.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function LandingPage() {
  const t = useTranslations("landing");
  const router = useRouter();
  const { data: session } = useSession();

  // Show dashboard link in hero if logged in, but DON'T redirect — let user see landing

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-16 pb-12 md:pt-24 md:pb-16 overflow-hidden">
        {/* Gradient mesh background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-500/[0.12] blur-[120px] hidden dark:block" />
          <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-cyan-500/[0.08] blur-[120px] hidden dark:block" />
        </div>

        {/* Glass card hero */}
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-8 backdrop-blur-sm">
            <GitHubIcon className="h-4 w-4" />
            {t("heroBadge")}
          </div>

          <h1 className="relative z-10 text-4xl md:text-6xl font-semibold tracking-tight mb-6 text-foreground dark:bg-gradient-to-r dark:from-white dark:to-white/80 dark:bg-clip-text dark:text-transparent">
            {t("title")}
          </h1>

          <p className="text-lg text-muted-foreground max-w-[600px] mx-auto mb-10 leading-relaxed">
            {t("heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {session?.user ? (
              <Button
                onClick={() => router.push("/dashboard")}
                size="lg"
                className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500"
              >
                <LayoutDashboard className="h-5 w-5" />
                {t("goToDashboard")}
              </Button>
            ) : (
              <SignInButton />
            )}
          </div>
        </div>

        {/* Decorative fade to background */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* What is this? */}
      <section className="py-10 md:py-16">
        <WhatIsThisSection />
      </section>

      {/* Demo Section */}
      <section className="py-10 md:py-16">
        <DemoSection />
      </section>

      {/* Famous Devs Section */}
      <section className="py-10 md:py-16 bg-muted/30">
        <FamousDevsSection />
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            {t("footerText")}
          </span>
          <div className="flex items-center gap-3">
            <LanguageFooterSelector />
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}
