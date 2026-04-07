"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { LifeGrid } from "@/components/life-grid";
import { ScaleSelector } from "@/components/scale-selector";
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
  } | null>(null);
  const [contributions, setContributions] = useState<YearContribution[]>([]);
  const [githubCreatedAt, setGithubCreatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [scale, setScale] = useState<GridScale>("weeks");

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
          setProfile({ birthDate: null, expectedAge: 75, githubCreatedAt: null });
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
        setProfile({ birthDate: null, expectedAge: 75, githubCreatedAt: null });
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
        {/* Sticky dashboard header */}
        <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm pb-4 -mx-6 px-6 pt-2 border-b border-border/50">
          {/* Life progress bar */}
          <div className="w-full mb-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
              <span>{stats.percentLived}% {t("lifeLivedProgress")}</span>
              <span>{stats.weeksLived.toLocaleString()} / {stats.weeksTotal.toLocaleString()} {t("weeksShort")}</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(stats.percentLived, 100)}%` }}
              />
            </div>
          </div>

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
