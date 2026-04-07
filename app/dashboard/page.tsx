"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { LifeGrid } from "@/components/life-grid";
import { ScaleSelector } from "@/components/scale-selector";
import { StickyStatsBar } from "@/components/sticky-stats-bar";
import { StatsPanel } from "@/components/stats-panel";
import { OnboardingForm } from "@/components/onboarding-form";
import { useSession } from "@/lib/auth-client";
import {
  generateGridCells,
  mapContributionsToWeeks,
  calculateStats,
} from "@/lib/grid-utils";
import type { ContributionWeek, GridScale, YearContribution } from "@/lib/types";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  const [profile, setProfile] = useState<{
    birthDate: string | null;
    expectedAge: number;
    githubCreatedAt: string | null;
    githubUsername: string | null;
  } | null>(null);
  const [contributions, setContributions] = useState<YearContribution[]>([]);
  const [githubCreatedAt, setGithubCreatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [scale, setScale] = useState<GridScale>("weeks");
  const [progressMounted, setProgressMounted] = useState(false);
  const [showMiniBar, setShowMiniBar] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  useEffect(() => { requestAnimationFrame(() => setProgressMounted(true)); }, []);
  // Show compact bar based on scroll position — rAF for smooth updates
  useEffect(() => {
    let ticking = false;
    function handleScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (statsRef.current) {
          const rect = statsRef.current.getBoundingClientRect();
          setShowMiniBar(rect.top < -20);
        }
        ticking = false;
      });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push("/");
    }
  }, [session, sessionLoading, router]);

  // Fetch user profile
  useEffect(() => {
    if (!session?.user) return;

    fetch("/api/user")
      .then((res) => {
        if (res.status === 404) {
          // No profile yet — need onboarding
          setProfile({ birthDate: null, expectedAge: 75, githubCreatedAt: null, githubUsername: null });
          return null;
        }
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setProfile(data);
        }
      })
      .catch(() => {
        setProfile({ birthDate: null, expectedAge: 75, githubCreatedAt: null, githubUsername: null });
      })
      .finally(() => setProfileLoading(false));
  }, [session?.user]);

  // Fetch contributions once profile is loaded and has birthDate
  useEffect(() => {
    if (!profile?.birthDate) {
      // Only stop loading if profile is actually loaded (not still pending)
      if (!profileLoading) setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/contributions")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch contributions");
        return res.json();
      })
      .then((data) => {
        // Flatten contributions from all years into YearContribution[]
        const allContribs: YearContribution[] = [];
        const contribsByYear = data.contributions as Record<
          number,
          ContributionWeek[]
        >;

        for (const [, weeks] of Object.entries(contribsByYear)) {
          for (const week of weeks) {
            allContribs.push({
              date: week.startDate,
              count: week.totalCommits,
            });
          }
        }

        setContributions(allContribs);

        // Re-fetch profile to get githubCreatedAt (set by contributions API via fetchViewerMeta)
        // Wait for this before setLoading(false) so grid doesn't flash
        return fetch("/api/user").then(r => r.ok ? r.json() : null).then(p => {
          if (p?.githubCreatedAt) {
            setGithubCreatedAt(new Date(p.githubCreatedAt));
          }
        });
      })
      .catch(() => {
        setContributions([]);
      })
      .finally(() => setLoading(false));
  }, [profile?.birthDate]);

  // Generate grid cells and stats
  const weekMap = useMemo(
    () => mapContributionsToWeeks(contributions),
    [contributions],
  );

  const cells = useMemo(() => {
    if (!profile?.birthDate || loading) return [];
    return generateGridCells(
      new Date(profile.birthDate),
      profile.expectedAge ?? 75,
      githubCreatedAt,
      weekMap,
    );
  }, [profile, weekMap, loading, githubCreatedAt]);

  const stats = useMemo(() => calculateStats(cells), [cells]);

  // Show full skeleton while loading session/profile
  if (sessionLoading || profileLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 container mx-auto p-6 flex flex-col space-y-6">
          {/* Profile skeleton */}
          <div className="flex items-center gap-4 animate-pulse">
            <div className="h-14 w-14 rounded-full bg-muted shrink-0" />
            <div className="space-y-2">
              <div className="h-6 w-40 bg-muted rounded" />
              <div className="h-3.5 w-56 bg-muted rounded" />
            </div>
          </div>

          {/* Progress bar skeleton */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full" />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-muted rounded-l-lg" />
                <div className="h-3 w-20 bg-muted rounded animate-pulse mb-2" />
                <div className="h-7 w-28 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Grid skeleton */}
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <LifeGrid cells={[]} expectedAge={75} loading={true} />
          </div>
        </main>
      </>
    );
  }

  if (!session?.user) return null;

  // If no birthDate, show onboarding
  if (!profile?.birthDate) {
    return (
      <>
        <Header />
        <main className="flex-1 container mx-auto p-6">
          <OnboardingForm />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto p-6 flex flex-col space-y-6">
        <StickyStatsBar
          show={showMiniBar}
          stats={stats}
          name={session.user.name ?? undefined}
          avatarUrl={session.user.image ?? undefined}
          githubUsername={profile?.githubUsername ?? undefined}
          githubSince={githubCreatedAt}
          weeksLabel={t("weeksShort")}
          activeLabel={t("activeWeeks")}
          streakLabel={t("currentStreak")}
          bestLabel={t("longestStreak")}
          sinceLabel={t("githubSince")}
        />

        {/* Profile header */}
        <div className="flex items-center gap-4">
          {session.user.image && (
            <img src={session.user.image} alt={session.user.name ?? ""} className="h-14 w-14 rounded-full border-2 border-primary/30" />
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{session.user.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {profile?.githubUsername && (
                <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                  @{profile.githubUsername}
                </a>
              )}
              {githubCreatedAt && (
                <span>{t("githubSince")} {new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short" }).format(githubCreatedAt)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Full stats cards */}
        <div className="w-full">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
            <span>{stats.percentLived}% {t("lifeLivedProgress")}</span>
            <span>{stats.weeksLived.toLocaleString()} / {stats.weeksTotal.toLocaleString()} {t("weeksShort")}</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: progressMounted ? `${Math.min(stats.percentLived, 100)}%` : "0%" }}
            />
          </div>
        </div>

        <div ref={statsRef}>
          <StatsPanel stats={stats} scale={scale} githubSince={githubCreatedAt} />
        </div>

        <div className="rounded-lg border border-border bg-card/50 p-4">
          <div className="flex items-center justify-end mb-3">
            <ScaleSelector scale={scale} onChange={setScale} />
          </div>
          <LifeGrid
            cells={cells}
            expectedAge={profile.expectedAge ?? 75}
            loading={loading}
            scale={scale}
          />
        </div>
      </main>
    </>
  );
}
