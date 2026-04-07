import { getWeekNumber } from "@/lib/grid-utils";
import type { ContributionWeek } from "@/lib/types";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

interface ContributionDay {
  contributionCount: number;
  date: string;
}

export interface GHWeek {
  contributionDays: ContributionDay[];
}

async function graphql<T>(token: string, query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(variables ? { query, variables } : { query }),
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL: ${json.errors[0].message}`);
  }

  return json.data;
}

// ── Fetch contribution years for the authenticated user ────────────────────

export async function fetchContributionYears(
  token: string,
): Promise<number[]> {
  const data = await graphql<{
    viewer: { contributionsCollection: { contributionYears: number[] } };
  }>(token, `{ viewer { contributionsCollection { contributionYears } } }`);

  return data.viewer.contributionsCollection.contributionYears;
}

// ── Fetch viewer metadata ──────────────────────────────────────────────────

export async function fetchViewerMeta(
  token: string,
): Promise<{ id: string; login: string; avatarUrl: string; createdAt: string }> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub REST API error: ${res.status} ${res.statusText}`);
  }

  const user = await res.json();
  return {
    id: String(user.id),
    login: user.login,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
  };
}

// ── Batch fetch contributions using aliases (up to 5 years per query) ──────

function buildContributionFragments(years: number[]): string {
  return years
    .map(
      (y) =>
        `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
          contributionCalendar {
            weeks { contributionDays { contributionCount date } }
          }
        }`,
    )
    .join("\n");
}

function extractYearsFromResponse(
  viewer: Record<string, { contributionCalendar: { weeks: GHWeek[] } }>,
  years: number[],
): Record<number, GHWeek[]> {
  const result: Record<number, GHWeek[]> = {};
  for (const year of years) {
    const collection = viewer[`y${year}`];
    if (collection) {
      result[year] = collection.contributionCalendar.weeks;
    }
  }
  return result;
}

export async function fetchContributionsBatch(
  token: string,
  years: number[],
): Promise<Record<number, GHWeek[]>> {
  const result: Record<number, GHWeek[]> = {};

  // Process in chunks of 5 years
  for (let i = 0; i < years.length; i += 5) {
    const chunk = years.slice(i, i + 5);
    const fragments = buildContributionFragments(chunk);
    const query = `{ viewer { ${fragments} } }`;

    const data = await graphql<{ viewer: Record<string, { contributionCalendar: { weeks: GHWeek[] } }> }>(
      token,
      query,
    );

    Object.assign(result, extractYearsFromResponse(data.viewer, chunk));
  }

  return result;
}

// ── Fetch public contributions (uses GITHUB_PAT, not user token) ───────────

export async function fetchPublicContributions(
  username: string,
  years: number[],
): Promise<Record<number, GHWeek[]>> {
  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    throw new Error("GITHUB_PAT environment variable is required for public contribution queries");
  }

  const result: Record<number, GHWeek[]> = {};

  for (let i = 0; i < years.length; i += 5) {
    const chunk = years.slice(i, i + 5);
    const fragments = buildContributionFragments(chunk);
    const query = `query($login: String!) { user(login: $login) { ${fragments} } }`;

    const data = await graphql<{
      user: Record<string, { contributionCalendar: { weeks: GHWeek[] } }> | null;
    }>(pat, query, { login: username });

    if (data.user) {
      Object.assign(result, extractYearsFromResponse(data.user, chunk));
    }
  }

  return result;
}

// ── Convert GitHub weeks to our simplified 52-week model ───────────────────

export function convertGHWeeksToOurs(
  year: number,
  ghWeeks: GHWeek[],
): ContributionWeek[] {
  const weekMap = new Map<number, number>();

  for (const ghWeek of ghWeeks) {
    for (const day of ghWeek.contributionDays) {
      const date = new Date(day.date);
      if (date.getFullYear() !== year) continue; // skip cross-year boundary days
      const weekNum = getWeekNumber(date);
      weekMap.set(weekNum, (weekMap.get(weekNum) || 0) + day.contributionCount);
    }
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekNumber, totalCommits]) => ({
      weekNumber,
      startDate: new Date(year, 0, 1 + (weekNumber - 1) * 7).toISOString(),
      totalCommits,
    }));
}
