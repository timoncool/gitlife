"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SignInButton } from "@/components/sign-in-button";
import { LifeGrid } from "@/components/life-grid";
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
import { ArrowRight, Search, Globe, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  generateGridCells,
  mapContributionsToWeeks,
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

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "es", label: "Espanol" },
  { value: "pt", label: "Portugues" },
  { value: "ru", label: "Русский" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
] as const;

const FAMOUS_DEVS = [
  { username: "torvalds", label: "Linus Torvalds", tag: "Linux" },
  { username: "yyx990803", label: "Evan You", tag: "Vue.js" },
  { username: "rauchg", label: "Guillermo Rauch", tag: "Vercel" },
  { username: "sindresorhus", label: "Sindre Sorhus", tag: "1000+ npm packages" },
  { username: "tj", label: "TJ Holowaychuk", tag: "Express.js" },
  { username: "addyosmani", label: "Addy Osmani", tag: "Chrome" },
  { username: "ThePrimeagen", label: "ThePrimeagen", tag: "Content creator" },
  { username: "antirez", label: "Salvatore Sanfilippo", tag: "Redis" },
  { username: "defunkt", label: "Chris Wanstrath", tag: "GitHub co-founder" },
  { username: "mitchellh", label: "Mitchell Hashimoto", tag: "HashiCorp" },
  { username: "rich-harris", label: "Rich Harris", tag: "Svelte" },
  { username: "dan-abramov", label: "Dan Abramov", tag: "React" },
  { username: "kentcdodds", label: "Kent C. Dodds", tag: "Testing/React" },
  { username: "tannerlinsley", label: "Tanner Linsley", tag: "TanStack" },
];

const DEFAULT_EXPECTED_AGE = 80;
const DEMO_YEARS_BACK = 10;

interface DemoData {
  username: string;
  createdAt: string;
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
}: {
  data: DemoData;
  birthYear: number;
}) {
  const birthDate = useMemo(() => new Date(birthYear, 0, 1), [birthYear]);
  const githubCreated = useMemo(() => new Date(data.createdAt), [data.createdAt]);
  const flat = useMemo(() => flattenContributions(data.contributions), [data]);
  const weekMap = useMemo(() => mapContributionsToWeeks(flat), [flat]);

  // Only show recent years for demo
  const currentYear = new Date().getFullYear();
  const startAge = Math.max(0, currentYear - birthYear - DEMO_YEARS_BACK);
  const endAge = currentYear - birthYear + 1;
  const displayAge = endAge - startAge;

  const cells = useMemo(() => {
    const allCells = generateGridCells(
      birthDate,
      DEFAULT_EXPECTED_AGE,
      githubCreated,
      weekMap,
    );
    // Filter to only show the recent slice
    return allCells.filter(
      (c) => c.year >= startAge && c.year < endAge,
    ).map((c) => ({ ...c, year: c.year - startAge }));
  }, [birthDate, githubCreated, weekMap, startAge, endAge]);

  return (
    <div className="w-full overflow-x-auto">
      <LifeGrid cells={cells} expectedAge={displayAge} />
    </div>
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
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{t("demoTitle")}</h2>
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
        <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <GitHubIcon className="h-5 w-5" />
            <span className="font-semibold text-lg">{data.username}</span>
            <span className="text-sm text-muted-foreground">
              Last {DEMO_YEARS_BACK} years
            </span>
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
  dev: { username: string; label: string; tag: string };
}) {
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetched.current) {
          fetched.current = true;
          setLoading(true);
          fetch(`/data/devs/${encodeURIComponent(dev.username)}.json`)
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => {
              if (json) setData(json);
            })
            .finally(() => setLoading(false));
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [dev.username]);

  const birthYear = data
    ? new Date(data.createdAt).getFullYear() - 30
    : 1970;

  return (
    <div ref={ref}>
      <Link
        href={`/demo?username=${encodeURIComponent(dev.username)}`}
        className="group rounded-xl border bg-card/50 backdrop-blur-sm p-5 flex flex-col gap-3 transition-all hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <GitHubIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{dev.label}</span>
          <span className="text-xs text-muted-foreground">@{dev.username}</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            {dev.tag}
          </span>
        </div>
        {loading && (
          <div className="h-24 flex items-center justify-center text-muted-foreground animate-pulse text-sm">
            Loading...
          </div>
        )}
        {data && <DemoMiniGrid data={data} birthYear={birthYear} />}
        {!loading && !data && (
          <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
            Scroll to load
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          <span>View full life grid</span>
          <ExternalLink className="h-3 w-3" />
        </div>
      </Link>
    </div>
  );
}

function FamousDevsSection() {
  const t = useTranslations("landing");

  return (
    <section className="w-full max-w-7xl mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
          {t("famousTitle")}
        </h2>
        <p className="text-muted-foreground">{t("famousSubtitle")}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FAMOUS_DEVS.map((dev) => (
          <FamousDevCard key={dev.username} dev={dev} />
        ))}
      </div>
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
      <SelectTrigger className="w-[140px]">
        <Globe className="h-4 w-4 mr-1" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            {lang.label}
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
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        {/* Gradient mesh background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-500/[0.12] blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-cyan-500/[0.08] blur-[120px]" />
        </div>

        {/* Glass card hero */}
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-8 backdrop-blur-sm">
            <GitHubIcon className="h-4 w-4" />
            GitHub-powered life tracker
          </div>

          <h1 className="relative z-10 text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground bg-gradient-to-r from-white to-white/80 bg-clip-text dark:text-transparent">
            {t("title")}
          </h1>

          <p className="text-lg text-muted-foreground max-w-[600px] mx-auto mb-10 leading-relaxed">
            {t("heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignInButton />
            <ThemeToggle />
          </div>
        </div>

        {/* Decorative fade to background */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Demo Section */}
      <section className="py-16 md:py-24">
        <DemoSection />
      </section>

      {/* Famous Devs Section */}
      <section className="py-16 md:py-24 bg-muted/30">
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
