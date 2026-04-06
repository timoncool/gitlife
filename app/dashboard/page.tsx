"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { LifeGrid } from "@/components/life-grid";
import { StatsPanel } from "@/components/stats-panel";
import { OnboardingForm } from "@/components/onboarding-form";
import { useSession } from "@/lib/auth-client";
import {
  generateGridCells,
  mapContributionsToWeeks,
  calculateStats,
} from "@/lib/grid-utils";
import type { ContributionWeek, YearContribution } from "@/lib/types";

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
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

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
      setLoading(false);
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
    if (!profile?.birthDate) return [];
    return generateGridCells(
      new Date(profile.birthDate),
      profile.expectedAge ?? 75,
      profile.githubCreatedAt ? new Date(profile.githubCreatedAt) : null,
      weekMap,
    );
  }, [profile, weekMap]);

  const stats = useMemo(() => calculateStats(cells), [cells]);

  // Show nothing while checking session
  if (sessionLoading || profileLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-muted-foreground animate-pulse text-lg">
              {t("loading")}
            </div>
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
      <main className="flex-1 container mx-auto p-6 flex flex-col gap-8">
        <StatsPanel stats={stats} />
        <LifeGrid
          cells={cells}
          expectedAge={profile.expectedAge ?? 75}
          loading={loading}
        />
      </main>
    </>
  );
}
