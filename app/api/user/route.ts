import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { account, userProfiles } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { calculateLifeExpectancy } from "@/lib/life-expectancy";
import type { CalculatorAnswers } from "@/lib/types";

async function getGithubId(userId: string): Promise<string | null> {
  const accounts = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "github")));

  return accounts[0]?.accountId ?? null;
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const githubId = await getGithubId(session.user.id);
    if (!githubId) {
      return NextResponse.json(
        { error: "GitHub account not linked" },
        { status: 400 },
      );
    }

    const profiles = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.githubId, githubId));

    if (profiles.length === 0) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(profiles[0]);
  } catch (error) {
    console.error("User GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const githubId = await getGithubId(session.user.id);
    if (!githubId) {
      return NextResponse.json(
        { error: "GitHub account not linked" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { birthDate, expectedAge, calculatorAnswers } = body as {
      birthDate?: string;
      expectedAge?: number;
      calculatorAnswers?: CalculatorAnswers;
    };

    // If calculator answers provided and no manual expectedAge, calculate it
    let finalExpectedAge = expectedAge;
    if (calculatorAnswers && !expectedAge) {
      const result = calculateLifeExpectancy(calculatorAnswers);
      finalExpectedAge = Math.round(result.estimated);
    }

    const now = new Date();

    await db
      .insert(userProfiles)
      .values({
        githubId,
        githubUsername: session.user.name ?? "unknown",
        birthDate: birthDate ?? null,
        expectedAge: finalExpectedAge ?? 75,
        calculatorAnswers: calculatorAnswers ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userProfiles.githubId,
        set: {
          ...(birthDate !== undefined && { birthDate }),
          ...(finalExpectedAge !== undefined && { expectedAge: finalExpectedAge }),
          ...(calculatorAnswers !== undefined && { calculatorAnswers }),
          updatedAt: now,
        },
      });

    // Return the updated profile
    const updated = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.githubId, githubId));

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("User PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
