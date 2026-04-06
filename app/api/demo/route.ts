import { NextRequest, NextResponse } from "next/server";
import { fetchPublicContributions, convertGHWeeksToOurs } from "@/lib/github";
import type { ContributionWeek } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username");
    if (!username) {
      return NextResponse.json(
        { error: "username query parameter is required" },
        { status: 400 },
      );
    }

    const pat = process.env.GITHUB_PAT;
    if (!pat) {
      return NextResponse.json(
        { error: "Server is not configured for public queries" },
        { status: 503 },
      );
    }

    // Fetch user profile from GitHub REST API to get createdAt
    const profileRes = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!profileRes.ok) {
      return NextResponse.json(
        { error: `GitHub user "${username}" not found` },
        { status: 404 },
      );
    }

    const profile = await profileRes.json();
    const createdAt = profile.created_at as string;
    const joinYear = new Date(createdAt).getFullYear();
    const currentYear = new Date().getFullYear();

    // Build array of years from join year to current year
    const years: number[] = [];
    for (let y = joinYear; y <= currentYear; y++) {
      years.push(y);
    }

    // Fetch public contributions
    const ghData = await fetchPublicContributions(username, years);

    // Convert to our format
    const contributions: Record<number, ContributionWeek[]> = {};
    for (const [year, ghWeeks] of Object.entries(ghData)) {
      const yearNum = parseInt(year, 10);
      contributions[yearNum] = convertGHWeeksToOurs(yearNum, ghWeeks);
    }

    return NextResponse.json({
      username,
      createdAt,
      years,
      contributions,
    });
  } catch (error) {
    console.error("Demo API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
