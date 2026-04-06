import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contributionCache, userProfiles, account } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  fetchContributionYears,
  fetchContributionsBatch,
  fetchViewerMeta,
  convertGHWeeksToOurs,
} from "@/lib/github";
import type { ContributionWeek } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session via Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const force = request.nextUrl.searchParams.get("force") === "true";

    // Get the GitHub OAuth access token from the account table
    const accounts = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "github")));

    const ghAccount = accounts[0];
    if (!ghAccount?.accessToken) {
      return NextResponse.json(
        { error: "GitHub account not linked or token missing" },
        { status: 400 },
      );
    }

    const token = ghAccount.accessToken;
    const githubId = ghAccount.accountId;

    // Fetch all contribution years from GitHub
    const allYears = await fetchContributionYears(token);

    // Determine which years need fetching
    let yearsToFetch: number[];

    if (force) {
      yearsToFetch = allYears;
    } else {
      // Check which years are already cached, with TTL validation
      const cacheKeys = allYears.map((y) => `${githubId}:${y}`);
      const cached = cacheKeys.length > 0
        ? await db
            .select({ id: contributionCache.id, cachedAt: contributionCache.cachedAt })
            .from(contributionCache)
            .where(inArray(contributionCache.id, cacheKeys))
        : [];

      const now = Date.now();
      const currentYear = new Date().getFullYear();
      const TTL_CURRENT_YEAR = 86400000; // 24 hours
      const TTL_HISTORICAL = 2592000000; // 30 days

      const freshYears = new Set(
        cached
          .filter((c) => {
            const year = parseInt(c.id.split(":")[1], 10);
            const age = now - new Date(c.cachedAt).getTime();
            const ttl = year === currentYear ? TTL_CURRENT_YEAR : TTL_HISTORICAL;
            return age < ttl;
          })
          .map((c) => parseInt(c.id.split(":")[1], 10)),
      );
      yearsToFetch = allYears.filter((y) => !freshYears.has(y));
    }

    // Fetch missing years from GitHub API
    if (yearsToFetch.length > 0) {
      const ghData = await fetchContributionsBatch(token, yearsToFetch);

      // Convert and store each year
      for (const [year, ghWeeks] of Object.entries(ghData)) {
        const yearNum = parseInt(year, 10);
        const weeks = convertGHWeeksToOurs(yearNum, ghWeeks);
        const cacheId = `${githubId}:${yearNum}`;

        await db
          .insert(contributionCache)
          .values({
            id: cacheId,
            githubId,
            year: yearNum,
            data: weeks,
            cachedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: contributionCache.id,
            set: {
              data: weeks,
              cachedAt: new Date(),
            },
          });
      }
    }

    // Fetch and store viewer meta on first request (if profile doesn't exist yet)
    const existingProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.githubId, githubId));

    if (existingProfile.length === 0 || force) {
      const meta = await fetchViewerMeta(token);

      await db
        .insert(userProfiles)
        .values({
          githubId: meta.id,
          githubUsername: meta.login,
          githubCreatedAt: meta.createdAt,
          githubAvatarUrl: meta.avatarUrl,
        })
        .onConflictDoUpdate({
          target: userProfiles.githubId,
          set: {
            githubUsername: meta.login,
            githubCreatedAt: meta.createdAt,
            githubAvatarUrl: meta.avatarUrl,
            updatedAt: new Date(),
          },
        });
    }

    // Return all cached contribution data
    const allCacheKeys = allYears.map((y) => `${githubId}:${y}`);
    const allCached = allCacheKeys.length > 0
      ? await db
          .select()
          .from(contributionCache)
          .where(inArray(contributionCache.id, allCacheKeys))
      : [];

    const contributions: Record<number, ContributionWeek[]> = {};
    for (const row of allCached) {
      contributions[row.year] = row.data as ContributionWeek[];
    }

    return NextResponse.json({
      years: allYears,
      contributions,
    });
  } catch (error) {
    console.error("Contributions API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
