# Commit Your Life — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a "life in weeks" visualization app with GitHub contributions overlay, life expectancy calculator, and i18n support.

**Architecture:** Next.js 16.2 App Router with Better Auth for GitHub OAuth, Upstash Redis for storage, SVG grid for visualization. Server Components for data fetching, Client Components for interactivity. Static JSON for life expectancy data.

**Tech Stack:** Next.js 16.2, Better Auth, shadcn/ui (CLI v4), Tailwind CSS v4, Upstash Redis, next-intl 4.9+, GitHub GraphQL API

**Spec:** `docs/superpowers/specs/2026-04-06-commit-your-life-design.md`

---

## File Structure

```
commit-your-life/
├── app/
│   ├── layout.tsx                    # Root layout (providers, theme, i18n)
│   ├── page.tsx                      # Landing page (/)
│   ├── dashboard/
│   │   └── page.tsx                  # Dashboard with life grid
│   ├── settings/
│   │   └── page.tsx                  # Settings + life expectancy calculator
│   └── api/
│       ├── auth/[...all]/route.ts    # Better Auth handler
│       ├── user/route.ts             # GET/PUT user profile
│       ├── contributions/route.ts    # GET GitHub contributions
│       └── demo/route.ts             # GET public user contributions (no auth)
├── components/
│   ├── life-grid.tsx                 # SVG life grid (main visualization)
│   ├── life-grid-cell.tsx            # Single cell with tooltip
│   ├── life-grid-labels.tsx          # Axis labels (age, weeks)
│   ├── stats-panel.tsx               # Stats below grid
│   ├── onboarding-form.tsx           # Birthdate + gender + country form
│   ├── calculator-form.tsx           # Life expectancy calculator
│   ├── header.tsx                    # App header (avatar, theme, lang, nav)
│   ├── theme-toggle.tsx              # Dark/light/system toggle
│   ├── language-selector.tsx         # i18n language picker
│   ├── sign-in-button.tsx            # GitHub sign-in CTA
│   ├── famous-devs.tsx               # Landing page showcase
│   └── demo-grid.tsx                 # Public username preview grid
├── lib/
│   ├── auth.ts                       # Better Auth server config
│   ├── auth-client.ts                # Better Auth client
│   ├── redis.ts                      # Upstash Redis client
│   ├── github.ts                     # GitHub GraphQL queries
│   ├── life-expectancy.ts            # Calculator algorithm
│   ├── grid-utils.ts                 # Week/date mapping utilities
│   └── types.ts                      # Shared TypeScript types
├── middleware.ts                      # Auth protection for /dashboard, /settings
├── messages/
│   ├── en.json                       # English translations
│   ├── ru.json                       # Russian translations
│   ├── zh.json                       # Chinese translations
│   ├── es.json                       # Spanish translations
│   ├── pt.json                       # Portuguese translations
│   ├── de.json                       # German translations
│   └── ja.json                       # Japanese translations
├── public/
│   └── data/
│       └── life-expectancy.json      # WHO/World Bank data (static, ~15KB)
├── scripts/
│   └── fetch-life-expectancy.ts      # Build script to fetch World Bank data
├── i18n/
│   ├── config.ts                     # next-intl config
│   └── request.ts                    # next-intl request config
├── .env.local                        # Secrets (not committed)
├── next.config.ts                    # Next.js config + next-intl plugin
├── tailwind.config.ts                # Tailwind v4 config
└── package.json
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `.env.local`, `.gitignore`

- [ ] **Step 1: Create Next.js 16 project**

```bash
cd D:/Projects/life-in-weeks
npx create-next-app@latest . --typescript --tailwind --eslint --app --src=no --import-alias "@/*" --turbopack
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install better-auth @upstash/redis next-intl next-themes
npm install -D @types/node tsx
```

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init -d
```

Select: New York style, neutral base color.

- [ ] **Step 4: Add shadcn components we need**

```bash
npx shadcn@latest add button card select slider tooltip popover input label badge separator avatar dropdown-menu sheet sonner switch tabs calendar
```

- [ ] **Step 5: Create `.env.local`**

```env
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000

GITHUB_CLIENT_ID=<from GitHub OAuth App settings>
GITHUB_CLIENT_SECRET=<from GitHub OAuth App settings>
GITHUB_PAT=<personal access token for public API calls, no scopes needed>

UPSTASH_REDIS_REST_URL=<from Upstash dashboard>
UPSTASH_REDIS_REST_TOKEN=<from Upstash dashboard>
```

- [ ] **Step 6: Create `.gitignore` additions**

Ensure `.env.local` is in `.gitignore` (create-next-app should handle this).

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: Next.js 16 app running at http://localhost:3000

- [ ] **Step 8: Init git repo and commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js 16 project with shadcn/ui, better-auth, upstash"
```

---

## Task 2: Upstash Redis + Types

**Files:**
- Create: `lib/redis.ts`, `lib/types.ts`

- [ ] **Step 1: Create Upstash Redis account and database**

Go to https://console.upstash.com/, create a free Redis database. Copy REST URL and token to `.env.local`.

- [ ] **Step 2: Create `lib/types.ts`**

```typescript
export interface UserProfile {
  githubId: string;
  githubUsername: string;
  birthDate: string | null; // ISO date
  expectedAge: number;
  calculatorAnswers: CalculatorAnswers | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalculatorAnswers {
  gender: "male" | "female";
  country: string; // ISO 3166-1 alpha-3
  smoking: "never" | "quit_before_35" | "quit_35_54" | "quit_55plus" | "current";
  alcohol: "none" | "moderate" | "heavy";
  activity: "sedentary" | "light" | "moderate" | "active";
  height: number; // cm
  weight: number; // kg
  sleep: "lt6" | "6_7" | "7_8" | "9plus";
  diet: "poor" | "average" | "good" | "excellent";
  social: "isolated" | "some" | "strong";
  diabetes: "no" | "type2_under40" | "type2_40_50" | "type2_over50";
  familyLongevity: boolean;
  stress: "low" | "moderate" | "high" | "severe";
  education: "less_hs" | "hs" | "college" | "bachelor" | "graduate";
  maritalStatus: "married" | "cohabiting" | "divorced" | "widowed" | "single";
  hypertension: "normal" | "elevated" | "stage1" | "stage2" | "unknown";
  heartDiseaseCancer: string[];
  depression: "none" | "mild" | "moderate" | "severe";
  sittingHours: "lt4" | "4_6" | "7_9" | "10plus";
  optimism: "very" | "somewhat" | "neutral" | "pessimistic";
  purpose: "strong" | "moderate" | "uncertain" | "none";
  coffee: "0" | "1_2" | "3_4" | "5plus";
  airPollution: "clean" | "moderate" | "polluted" | "heavy";
}

export interface ContributionWeek {
  weekNumber: number;
  startDate: string;
  totalCommits: number;
}

export interface YearContributions {
  year: number;
  weeks: ContributionWeek[];
}

export interface GitHubMeta {
  createdAt: string;
  avatarUrl: string;
}

export interface CellData {
  year: number;
  week: number;
  startDate: Date;
  endDate: Date;
  state: "future" | "pre-github" | "no-commits" | "level-1" | "level-2" | "level-3" | "level-4" | "current";
  commits: number;
}
```

- [ ] **Step 3: Create `lib/redis.ts`**

```typescript
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Helper functions
export async function getUser(githubId: string) {
  return redis.get<import("./types").UserProfile>(`user:${githubId}`);
}

export async function setUser(githubId: string, data: import("./types").UserProfile) {
  await redis.set(`user:${githubId}`, data);
}

export async function getContributions(githubId: string, year: number) {
  return redis.get<import("./types").YearContributions>(`contributions:${githubId}:${year}`);
}

export async function setContributions(
  githubId: string,
  year: number,
  data: import("./types").YearContributions,
  isCurrentYear: boolean
) {
  const ttl = isCurrentYear ? 86400 : 2592000; // 24h or 30 days
  await redis.set(`contributions:${githubId}:${year}`, data, { ex: ttl });
}

export async function getGitHubMeta(githubId: string) {
  return redis.get<import("./types").GitHubMeta>(`github:meta:${githubId}`);
}

export async function setGitHubMeta(githubId: string, meta: import("./types").GitHubMeta) {
  await redis.set(`github:meta:${githubId}`, meta);
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts lib/redis.ts
git commit -m "feat: add TypeScript types and Upstash Redis client"
```

---

## Task 3: Better Auth + GitHub OAuth

**Files:**
- Create: `lib/auth.ts`, `lib/auth-client.ts`, `app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Create `lib/auth.ts`**

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: ["read:user", "user:email"],
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
```

**IMPORTANT:** Better Auth requires a database. For this MVP, use the built-in SQLite adapter:
1. `npm install better-sqlite3` + `npm install -D @types/better-sqlite3`
2. Add `database: { type: "sqlite", url: "./auth.db" }` to the config above
3. Add `auth.db` to `.gitignore`
4. To access the user's GitHub OAuth token for API calls, use `auth.api.getSession()` which returns the session including the `accessToken` field. Store `accessToken` in the session by adding `session: { cookieCache: { enabled: true } }` to config.

- [ ] **Step 2: Create `lib/auth-client.ts`**

```typescript
import { createAuthClient } from "better-auth/react";

export const { signIn, signOut, useSession } = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});
```

- [ ] **Step 3: Create `app/api/auth/[...all]/route.ts`**

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

- [ ] **Step 4: Add `NEXT_PUBLIC_BETTER_AUTH_URL` to `.env.local`**

```env
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

- [ ] **Step 5: Test auth flow**

Start dev server, navigate to `/api/auth/callback/github` — should see Better Auth response. Create a simple test page if needed to verify sign-in works.

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts lib/auth-client.ts app/api/auth/
git commit -m "feat: add Better Auth with GitHub OAuth"
```

---

## Task 4: i18n Setup (next-intl)

**Files:**
- Create: `i18n/config.ts`, `i18n/request.ts`, `messages/en.json`, `messages/ru.json` (+ 5 more), `next.config.ts` update

- [ ] **Step 1: Create `i18n/config.ts`**

```typescript
export const locales = ["en", "zh", "es", "pt", "ru", "de", "ja"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
```

- [ ] **Step 2: Create `i18n/request.ts`**

```typescript
import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { locales, defaultLocale } from "./config";

export default getRequestConfig(async () => {
  // Check cookie first, then Accept-Language header
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;
  if (cookieLocale && locales.includes(cookieLocale as any)) {
    return {
      locale: cookieLocale,
      messages: (await import(`../messages/${cookieLocale}.json`)).default,
    };
  }

  const headerStore = await headers();
  const acceptLang = headerStore.get("accept-language") || "";
  const browserLocale = acceptLang.split(",")[0]?.split("-")[0];
  const locale = locales.includes(browserLocale as any) ? browserLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

Note: Check next-intl 4.9 docs with context7 for any API changes before implementing.

- [ ] **Step 3: Create `messages/en.json`**

```json
{
  "landing": {
    "title": "Commit Your Life",
    "tagline": "Visualize your life in weeks. See how you've committed.",
    "signIn": "Sign in with GitHub",
    "tryDemo": "Or try with any public GitHub username",
    "placeholder": "Enter GitHub username..."
  },
  "dashboard": {
    "weeksLived": "Weeks lived",
    "weeksTotal": "Total expected",
    "lifeLived": "Life lived",
    "activeWeeks": "Active weeks",
    "currentStreak": "Current streak",
    "longestStreak": "Longest streak",
    "commits": "commits",
    "week": "Week",
    "age": "Age",
    "loading": "Loading contributions...",
    "noData": "Some contribution data unavailable",
    "noCommits": "No commits yet. Make your first commit to light up your grid!"
  },
  "settings": {
    "title": "Settings",
    "birthDate": "Date of birth",
    "lifeExpectancy": "Life expectancy",
    "calculator": "Life expectancy calculator",
    "manualOverride": "Or set manually",
    "save": "Save",
    "saved": "Saved!",
    "baseline": "Baseline (WHO)",
    "yourEstimate": "Your estimate",
    "years": "years",
    "impact": "Impact",
    "learnMore": "Learn more"
  },
  "onboarding": {
    "welcome": "Welcome! Let's set up your life grid.",
    "birthDate": "When were you born?",
    "gender": "Gender",
    "male": "Male",
    "female": "Female",
    "country": "Country",
    "start": "Start",
    "customize": "Customize life expectancy"
  },
  "header": {
    "dashboard": "Dashboard",
    "settings": "Settings",
    "signOut": "Sign out"
  },
  "factors": {
    "smoking": "Smoking",
    "alcohol": "Alcohol",
    "activity": "Physical activity",
    "bmi": "BMI",
    "sleep": "Sleep",
    "diet": "Diet quality",
    "social": "Social connections",
    "diabetes": "Diabetes",
    "family": "Family longevity",
    "stress": "Stress level",
    "education": "Education",
    "marital": "Marital status",
    "hypertension": "Blood pressure",
    "heartCancer": "Heart disease / Cancer",
    "depression": "Depression",
    "sitting": "Sitting time",
    "optimism": "Optimism",
    "purpose": "Purpose in life",
    "coffee": "Coffee",
    "airPollution": "Air pollution"
  }
}
```

- [ ] **Step 4: Create `messages/ru.json`**

Full Russian translation of all keys above. (Create the complete file with proper Russian translations.)

- [ ] **Step 5: Create remaining 5 language files**

`zh.json`, `es.json`, `pt.json`, `de.json`, `ja.json` — translate all keys. Use AI translation but review key terms. Can be placeholder English initially and translated later.

- [ ] **Step 6: Update `next.config.ts` for next-intl**

```typescript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 7: Update `app/layout.tsx` with NextIntlClientProvider**

Wrap the app with the provider. Set `<html lang={locale}>`.

- [ ] **Step 8: Commit**

```bash
git add i18n/ messages/ next.config.ts app/layout.tsx
git commit -m "feat: add next-intl i18n with 7 languages"
```

---

## Task 5: Theming (Dark/Light/System)

**Files:**
- Create: `components/theme-toggle.tsx`, update `app/layout.tsx`

- [ ] **Step 1: Create `components/theme-toggle.tsx`** (next-themes already installed in Task 1)

Use shadcn's Switch or DropdownMenu. Three states: system, light, dark. Store in cookie via next-themes.

- [ ] **Step 3: Update `app/layout.tsx`**

Wrap with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`.

- [ ] **Step 4: Verify theme switching works**

Toggle between dark/light/system. Check that Tailwind `dark:` classes apply correctly.

- [ ] **Step 5: Commit**

```bash
git add components/theme-toggle.tsx app/layout.tsx
git commit -m "feat: add dark/light/system theme toggle"
```

---

## Task 6: Life Expectancy Data + Calculator Algorithm

**Files:**
- Create: `scripts/fetch-life-expectancy.ts`, `public/data/life-expectancy.json`, `lib/life-expectancy.ts`

- [ ] **Step 1: Create `scripts/fetch-life-expectancy.ts`**

Script that fetches World Bank API for male (`SP.DYN.LE00.MA.IN`) and female (`SP.DYN.LE00.FE.IN`) life expectancy, merges them, filters out aggregates (region.id !== "NA"), writes to `public/data/life-expectancy.json`.

Format: `{ "USA": { "name": "United States", "male": 75.8, "female": 81.1 }, ... }`

- [ ] **Step 2: Run the script**

```bash
npx tsx scripts/fetch-life-expectancy.ts
```

Verify `public/data/life-expectancy.json` exists and has ~217 entries, ~15KB.

- [ ] **Step 3: Create `lib/life-expectancy.ts`**

Calculator algorithm: takes `CalculatorAnswers`, looks up baseline from JSON, applies additive modifiers, caps at baseline +/- 25.

```typescript
import data from "@/public/data/life-expectancy.json";
import type { CalculatorAnswers } from "./types";

const MODIFIERS: Record<string, Record<string, number>> = {
  smoking: { never: 0, quit_before_35: -1, quit_35_54: -4, quit_55plus: -7, current: -11 },
  alcohol: { none: 0, moderate: 0, heavy: -7 },
  activity: { sedentary: -3, light: 0, moderate: 2, active: 4 },
  sleep: { lt6: -1, "6_7": 0, "7_8": 0, "9plus": -2 },
  diet: { poor: -4, average: 0, good: 3, excellent: 6 },
  social: { isolated: -5, some: 0, strong: 2 },
  stress: { low: 1, moderate: 0, high: -1.5, severe: -2.5 },
  education: { less_hs: -4, hs: -2, college: 0, bachelor: 1.5, graduate: 2.5 },
  maritalStatus: { married: 2.5, cohabiting: 1, divorced: -1, widowed: -1, single: -2 },
  hypertension: { normal: 1, elevated: 0, stage1: -1.5, stage2: -3, unknown: -1 },
  depression: { none: 0, mild: -1, moderate: -3, severe: -6 },
  sittingHours: { lt4: 1, "4_6": 0, "7_9": -1, "10plus": -2 },
  optimism: { very: 2, somewhat: 1, neutral: 0, pessimistic: -1.5 },
  purpose: { strong: 2, moderate: 1, uncertain: 0, none: -1.5 },
  coffee: { "0": 0, "1_2": 1, "3_4": 0.5, "5plus": 0 },
  airPollution: { clean: 0.5, moderate: 0, polluted: -1, heavy: -2 },
  diabetes: { no: 0, type2_under40: -12, type2_40_50: -8, type2_over50: -5 },
};

// BMI modifiers
function getBmiModifier(height: number, weight: number): number {
  const bmi = weight / ((height / 100) ** 2);
  if (bmi < 18.5) return -4;
  if (bmi < 25) return 0;
  if (bmi < 30) return -1;
  if (bmi < 35) return -3;
  return -8;
}

// Heart disease / cancer
function getHeartCancerModifier(conditions: string[]): number {
  if (conditions.includes("active_cancer")) return -10;
  let mod = 0;
  if (conditions.includes("heart_disease")) mod -= 5;
  if (conditions.includes("cancer_remission")) mod -= 2;
  return mod;
}

export function calculateLifeExpectancy(answers: CalculatorAnswers): {
  baseline: number;
  estimated: number;
  breakdown: { factor: string; impact: number }[];
} {
  const countryData = (data as Record<string, { name: string; male: number; female: number }>)[answers.country];
  const baseline = countryData
    ? (answers.gender === "male" ? countryData.male : countryData.female)
    : 75; // fallback

  const breakdown: { factor: string; impact: number }[] = [];
  let totalModifier = 0;

  // Simple select-based modifiers
  for (const [key, values] of Object.entries(MODIFIERS)) {
    const answer = answers[key as keyof CalculatorAnswers];
    if (answer !== undefined && typeof answer === "string" && values[answer] !== undefined) {
      const impact = values[answer];
      if (impact !== 0) breakdown.push({ factor: key, impact });
      totalModifier += impact;
    }
  }

  // BMI
  if (answers.height && answers.weight) {
    const bmiImpact = getBmiModifier(answers.height, answers.weight);
    if (bmiImpact !== 0) breakdown.push({ factor: "bmi", impact: bmiImpact });
    totalModifier += bmiImpact;
  }

  // Family longevity
  if (answers.familyLongevity) {
    breakdown.push({ factor: "family", impact: 2.5 });
    totalModifier += 2.5;
  }

  // Heart disease / cancer
  const heartCancerImpact = getHeartCancerModifier(answers.heartDiseaseCancer || []);
  if (heartCancerImpact !== 0) {
    breakdown.push({ factor: "heartCancer", impact: heartCancerImpact });
    totalModifier += heartCancerImpact;
  }

  // Cap modifier
  const cappedModifier = Math.max(-25, Math.min(25, totalModifier));
  const estimated = Math.round(baseline + cappedModifier);

  return { baseline: Math.round(baseline), estimated, breakdown };
}
```

- [ ] **Step 4: Commit**

```bash
git add scripts/ public/data/ lib/life-expectancy.ts
git commit -m "feat: add WHO life expectancy data and calculator algorithm"
```

---

## Task 7: Grid Utilities

**Files:**
- Create: `lib/grid-utils.ts`

- [ ] **Step 1: Create `lib/grid-utils.ts`**

Utilities for mapping dates to grid cells:

```typescript
import type { CellData, YearContributions } from "./types";

// Get the week number (1-52) for a given date using simplified 52-week model
export function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const week = Math.floor(diff / oneWeek) + 1;
  return Math.min(week, 52); // absorb extra days into week 52
}

// Generate all cells for the life grid
export function generateGridCells(
  birthDate: Date,
  expectedAge: number,
  githubCreatedAt: Date | null,
  contributions: Map<string, number>, // "YYYY-WW" -> commit count
): CellData[] {
  const cells: CellData[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentWeek = getWeekNumber(now);
  const birthYear = birthDate.getFullYear();

  for (let age = 0; age < expectedAge; age++) {
    const year = birthYear + age;
    for (let week = 1; week <= 52; week++) {
      const cellDate = new Date(year, 0, 1 + (week - 1) * 7);
      const endDate = new Date(cellDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      const key = `${year}-${String(week).padStart(2, "0")}`;
      const commits = contributions.get(key) || 0;

      let state: CellData["state"];
      if (year > currentYear || (year === currentYear && week > currentWeek)) {
        state = "future";
      } else if (year === currentYear && week === currentWeek) {
        state = "current";
      } else if (githubCreatedAt && cellDate < githubCreatedAt) {
        state = "pre-github";
      } else if (commits === 0) {
        state = "no-commits";
      } else if (commits <= 3) {
        state = "level-1";
      } else if (commits <= 9) {
        state = "level-2";
      } else if (commits <= 19) {
        state = "level-3";
      } else {
        state = "level-4";
      }

      cells.push({ year: age, week, startDate: cellDate, endDate, state, commits });
    }
  }

  return cells;
}

// Map GitHub API contribution days to our simplified week format
export function mapContributionsToWeeks(
  yearContributions: YearContributions[]
): Map<string, number> {
  const map = new Map<string, number>();

  for (const yc of yearContributions) {
    for (const week of yc.weeks) {
      const key = `${yc.year}-${String(week.weekNumber).padStart(2, "0")}`;
      map.set(key, week.totalCommits);
    }
  }

  return map;
}

// Calculate stats from grid cells
export function calculateStats(cells: CellData[]) {
  const lived = cells.filter(c => !["future"].includes(c.state));
  const active = cells.filter(c => ["level-1", "level-2", "level-3", "level-4", "current"].includes(c.state) && c.commits > 0);
  const total = cells.length;

  // Streak calculation
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Sort by date and iterate
  const sortedLived = lived.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  for (const cell of sortedLived) {
    if (cell.commits > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Current streak = consecutive active weeks ending at current week
  const reversed = [...sortedLived].reverse();
  for (const cell of reversed) {
    if (cell.commits > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    weeksLived: lived.length,
    weeksTotal: total,
    percentLived: Math.round((lived.length / total) * 100),
    activeWeeks: active.length,
    currentStreak,
    longestStreak,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/grid-utils.ts
git commit -m "feat: add grid cell generation and stats utilities"
```

---

## Task 8: GitHub GraphQL Integration

**Files:**
- Create: `lib/github.ts`, `app/api/contributions/route.ts`

- [ ] **Step 1: Create `lib/github.ts`**

```typescript
const GITHUB_GRAPHQL = "https://api.github.com/graphql";

interface ContributionDay {
  contributionCount: number;
  date: string;
}

interface ContributionWeekGH {
  contributionDays: ContributionDay[];
}

// Fetch contribution years for the authenticated user
export async function fetchContributionYears(token: string): Promise<number[]> {
  const query = `{ viewer { contributionsCollection { contributionYears } createdAt } }`;
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  return data.data.viewer.contributionsCollection.contributionYears;
}

// Fetch viewer metadata
export async function fetchViewerMeta(token: string) {
  const query = `{ viewer { id login avatarUrl createdAt } }`;
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  return data.data.viewer;
}

// Batch fetch contributions for multiple years using aliases
export async function fetchContributionsBatch(
  token: string,
  years: number[]
): Promise<Record<number, ContributionWeekGH[]>> {
  const fragments = years.map(
    (y) =>
      `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { contributionCount date } }
        }
      }`
  );

  const query = `{ viewer { ${fragments.join("\n")} } }`;
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();

  const result: Record<number, ContributionWeekGH[]> = {};
  for (const year of years) {
    const collection = data.data.viewer[`y${year}`];
    if (collection) {
      result[year] = collection.contributionCalendar.weeks;
    }
  }
  return result;
}

// Fetch contributions for a public user (no auth, public data only)
export async function fetchPublicContributions(
  username: string,
  years: number[]
): Promise<Record<number, ContributionWeekGH[]>> {
  const fragments = years.map(
    (y) =>
      `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
        contributionCalendar {
          weeks { contributionDays { contributionCount date } }
        }
      }`
  );

  const query = `{ user(login: "${username}") { createdAt ${fragments.join("\n")} } }`;
  // GitHub GraphQL requires auth even for public data — use server-side PAT
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();

  const result: Record<number, ContributionWeekGH[]> = {};
  if (data.data?.user) {
    for (const year of years) {
      const collection = data.data.user[`y${year}`];
      if (collection) {
        result[year] = collection.contributionCalendar.weeks;
      }
    }
  }
  return result;
}

// Convert GitHub API weeks to our format
export function convertGHWeeksToOurs(
  year: number,
  ghWeeks: ContributionWeekGH[]
): import("./types").ContributionWeek[] {
  const weekMap = new Map<number, number>();

  for (const ghWeek of ghWeeks) {
    for (const day of ghWeek.contributionDays) {
      const date = new Date(day.date);
      if (date.getFullYear() !== year) continue; // skip cross-year boundary days
      const weekNum = getSimplifiedWeek(date);
      weekMap.set(weekNum, (weekMap.get(weekNum) || 0) + day.contributionCount);
    }
  }

  return Array.from(weekMap.entries()).map(([weekNumber, totalCommits]) => ({
    weekNumber,
    startDate: new Date(year, 0, 1 + (weekNumber - 1) * 7).toISOString(),
    totalCommits,
  }));
}

// Use getWeekNumber from grid-utils.ts — import { getWeekNumber } from "./grid-utils"
// Do NOT duplicate the function here
```

- [ ] **Step 2: Create `app/api/contributions/route.ts`**

Server route that fetches contributions using the user's OAuth token, caches in Redis.
Also calls `fetchViewerMeta()` on first request and stores result via `setGitHubMeta()` in Redis. This persists `createdAt` (for pre-GitHub cell state) and `avatarUrl`.

- [ ] **Step 3: Commit**

```bash
git add lib/github.ts app/api/contributions/route.ts
git commit -m "feat: add GitHub GraphQL integration with batching and caching"
```

---

## Task 9: User API Routes

**Files:**
- Create: `app/api/user/route.ts`

- [ ] **Step 1: Create `app/api/user/route.ts`**

GET: Return user profile from Redis. PUT: Update birthdate + calculator answers, recalculate expected age, save.

- [ ] **Step 2: Commit**

```bash
git add app/api/user/route.ts
git commit -m "feat: add user profile API routes"
```

---

## Task 9b: Auth Middleware + Demo API

**Files:**
- Create: `middleware.ts`, `app/api/demo/route.ts`

- [ ] **Step 1: Create `middleware.ts`**

Protect `/dashboard` and `/settings` routes. Redirect unauthenticated users to `/`. Use Better Auth's `getSession` helper. Note: Next.js 16 renamed middleware.ts to proxy.ts — check Better Auth docs for exact setup.

```typescript
import { auth } from "@/lib/auth";

export default auth.handler; // or use Better Auth's middleware helper
// Protect: /dashboard, /settings
```

- [ ] **Step 2: Create `app/api/demo/route.ts`**

Public API route for demo mode. Accepts `?username=torvalds` query param. Uses `GITHUB_PAT` to fetch public contributions via `fetchPublicContributions`. No auth required.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts app/api/demo/route.ts
git commit -m "feat: add auth middleware and public demo API route"
```

---

## Task 10: Header Component

**Files:**
- Create: `components/header.tsx`, `components/language-selector.tsx`, `components/sign-in-button.tsx`

- [ ] **Step 1: Create `components/header.tsx`**

Uses shadcn Avatar, DropdownMenu, Button. Shows GitHub avatar + username, theme toggle, language selector, settings link, sign out. Responsive — Sheet menu on mobile.

- [ ] **Step 2: Create `components/language-selector.tsx`**

shadcn Select with 7 language options. Sets cookie and reloads.

- [ ] **Step 3: Create `components/sign-in-button.tsx`**

Button that calls `signIn.social({ provider: "github" })`.

- [ ] **Step 4: Commit**

```bash
git add components/header.tsx components/language-selector.tsx components/sign-in-button.tsx
git commit -m "feat: add header with auth, theme toggle, language selector"
```

---

## Task 11: Life Grid SVG Component

**Files:**
- Create: `components/life-grid.tsx`, `components/life-grid-cell.tsx`, `components/life-grid-labels.tsx`

- [ ] **Step 1: Create `components/life-grid-cell.tsx`**

Single SVG `<rect>` with:
- Color based on cell state + theme (use CSS variables or Tailwind classes)
- Hit area padded for mobile (~12px invisible padding)
- Tooltip on hover (shadcn Tooltip) showing date, age, commits

- [ ] **Step 2: Create `components/life-grid-labels.tsx`**

Y-axis: age labels every 5 years. X-axis: week labels every 10 (1, 10, 20, 30, 40, 50).

- [ ] **Step 3: Create `components/life-grid.tsx`**

Main SVG container. Receives `CellData[]`, renders grid with labels. Responsive sizing based on container width. Current week highlighted with orange stroke.

Includes:
- Loading state: skeleton grid with shimmer + progress text ("Loading 2020, 2021...")
- "Refresh" button to force re-fetch contributions (calls API with `?force=true`)
- Error banner: "Some contribution data unavailable" if partial data

- [ ] **Step 4: Commit**

```bash
git add components/life-grid.tsx components/life-grid-cell.tsx components/life-grid-labels.tsx
git commit -m "feat: add SVG life grid visualization component"
```

---

## Task 12: Stats Panel

**Files:**
- Create: `components/stats-panel.tsx`

- [ ] **Step 1: Create `components/stats-panel.tsx`**

Uses shadcn Card. Shows 6 stats from `calculateStats()`: weeks lived, total, % lived, active weeks, current streak, longest streak. Localized labels via `useTranslations`.

- [ ] **Step 2: Commit**

```bash
git add components/stats-panel.tsx
git commit -m "feat: add stats panel component"
```

---

## Task 13: Onboarding Form

**Files:**
- Create: `components/onboarding-form.tsx`

- [ ] **Step 1: Create `components/onboarding-form.tsx`**

Form with: date picker (shadcn Popover + Calendar), gender select, country select (from life-expectancy.json keys). Submits to `PUT /api/user`.

- [ ] **Step 2: Commit**

```bash
git add components/onboarding-form.tsx
git commit -m "feat: add onboarding form component"
```

---

## Task 14: Calculator Form

**Files:**
- Create: `components/calculator-form.tsx`

- [ ] **Step 1: Create `components/calculator-form.tsx`**

Large form with all 21 factors. Each factor has:
- Label (localized)
- Select/input
- Info icon that opens popover with study DOI link
- Real-time preview: shows impact (+/- years) as user changes values

Bottom: baseline, total modifier, estimated age. Manual override slider (50-110).
Save button.

This is the largest component — break into sub-sections if needed (lifestyle, medical, psychological, environmental).

- [ ] **Step 2: Commit**

```bash
git add components/calculator-form.tsx
git commit -m "feat: add life expectancy calculator form with 21 factors"
```

---

## Task 15: Dashboard Page

**Files:**
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Create `app/dashboard/page.tsx`**

Server Component. Checks auth session. If no birthdate -> renders OnboardingForm. Otherwise: fetches contributions from API, generates grid cells, renders LifeGrid + StatsPanel.

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add dashboard page with life grid and stats"
```

---

## Task 16: Settings Page

**Files:**
- Create: `app/settings/page.tsx`

- [ ] **Step 1: Create `app/settings/page.tsx`**

Renders CalculatorForm with current user data pre-filled. Tabs: "Calculator" and "Manual".

- [ ] **Step 2: Commit**

```bash
git add app/settings/page.tsx
git commit -m "feat: add settings page with life expectancy calculator"
```

---

## Task 17: Landing Page

**Files:**
- Update: `app/page.tsx`
- Create: `components/famous-devs.tsx`, `components/demo-grid.tsx`

- [ ] **Step 1: Create `components/famous-devs.tsx`**

Pre-built mini-grids for famous GitHub users. Data fetched at build time (ISR). Shows username, avatar, total contributions, mini life grid preview.

- [ ] **Step 2: Create `components/demo-grid.tsx`**

Input field for any public GitHub username. Fetches and displays their grid on submit (public data, no auth).

- [ ] **Step 3: Update `app/page.tsx`**

Landing page: hero section, sign-in button, famous devs carousel, demo input, footer.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/famous-devs.tsx components/demo-grid.tsx
git commit -m "feat: add landing page with famous devs showcase and demo mode"
```

---

## Task 18: Root Layout + Providers (PRIORITY: do this right after Task 5)

**Files:**
- Update: `app/layout.tsx`

**Note:** This task should be done right after Task 5 (theming), before building UI components. Tasks 4 and 5 already partially set up the layout — this task wires in the remaining providers (auth session, Better Auth context) so all subsequent component tasks can test properly.

- [ ] **Step 1: Finalize `app/layout.tsx`**

Wire up all providers: ThemeProvider, NextIntlClientProvider, Better Auth session provider. Add Header for authenticated routes. Set metadata (title, description, og:image).

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: finalize root layout with all providers"
```

---

## Task 19: Polish + Responsive + Testing

- [ ] **Step 1: Test full flow locally**

1. Visit `/` — see landing page
2. Click "Sign in with GitHub" — OAuth flow
3. First visit → onboarding form → enter birthdate
4. Dashboard shows life grid with contributions
5. Settings → fill calculator → see updated estimate
6. Toggle theme, switch language
7. Test on mobile viewport

- [ ] **Step 2: Fix any issues found**

- [ ] **Step 3: Commit**

```bash
git commit -m "fix: polish UI, responsive design, and edge cases"
```

---

## Task 20: Deploy to Vercel

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create commit-your-life --public --source=. --push
```

- [ ] **Step 2: Deploy to Vercel**

```bash
npx vercel --prod
```

Or link via Vercel dashboard.

- [ ] **Step 3: Set environment variables on Vercel**

Add all `.env.local` vars to Vercel project settings. Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` to production URL.

- [ ] **Step 4: Update GitHub OAuth App callback URL**

Add production URL: `https://<domain>/api/auth/callback/github`

- [ ] **Step 5: Verify production deployment**

Test full flow on production URL.

- [ ] **Step 6: Final commit**

```bash
git commit -m "chore: configure for Vercel deployment"
```
