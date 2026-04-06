"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LifeGrid } from "@/components/life-grid";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import {
  generateGridCells,
  mapContributionsToWeeks,
} from "@/lib/grid-utils";
import type { ContributionWeek, YearContribution } from "@/lib/types";

const DEFAULT_EXPECTED_AGE = 80;
const DEMO_YEARS_BACK = 10;

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
  const initialUsername = searchParams.get("username") || "";

  const [username, setUsername] = useState(initialUsername);
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

  const birthYear = data
    ? new Date(data.createdAt).getFullYear() - 25
    : 1990;

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
      DEFAULT_EXPECTED_AGE,
      githubCreated,
      weekMap,
    );
  }, [data, birthDate, githubCreated, weekMap]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Search bar */}
      <div className="container mx-auto px-4 py-8">
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
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              {data.avatarUrl && (
                <img
                  src={data.avatarUrl}
                  alt={data.username}
                  className="h-12 w-12 rounded-full"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {data.username}
                </h1>
                <p className="text-sm text-muted-foreground">
                  GitHub member since{" "}
                  {new Date(data.createdAt).getFullYear()} — Full life
                  grid ({DEFAULT_EXPECTED_AGE} years)
                </p>
              </div>
            </div>
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-6 overflow-x-auto">
              <LifeGrid cells={cells} expectedAge={DEFAULT_EXPECTED_AGE} />
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
