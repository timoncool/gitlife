# Commit Your Life — Design Spec

## Overview

"Commit Your Life" — web-app that visualizes a human life as a grid of weeks (52 columns x N rows), overlaying GitHub contribution data onto the lived weeks. The name plays on "git commit" + "commit to your life".

Users sign in with GitHub, enter their birthdate, optionally answer a scientifically-backed life expectancy questionnaire, and see their entire life mapped out — with green-shaded weeks where they made commits and gray weeks where they didn't. Future weeks remain empty outlines.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.2 (App Router, React 19, Turbopack) |
| Auth | Better Auth | latest (replaces deprecated Better Auth/NextAuth) |
| UI Kit | shadcn/ui | CLI v4 (unified Radix UI + Tailwind) |
| Styling | Tailwind CSS | v4 |
| Storage | Upstash Redis | @upstash/redis (replaces sunset Upstash Redis) |
| i18n | next-intl | 4.9+ |
| Grid rendering | SVG | - |
| GitHub data | GitHub GraphQL API | v4 |
| Deployment | Vercel | - |

### GitHub OAuth App (already created)

- **App name:** Commit Your Life
- Credentials stored in `.env.local` (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)
- **Callback URLs:** `http://localhost:3000/api/auth/callback/github` (dev), production URL added before deploy
- Logo generated (grid pattern on dark background)

## Pages

### 1. Landing Page (`/`)

**Not authenticated state:**
- Hero: "Commit Your Life" title + tagline (localized)
- Brief explanation of the concept with animated demo grid (fake data)
- Single CTA: "Sign in with GitHub" button
- **Famous devs showcase:** Pre-built grids of famous GitHub users (public data via `user(login:)`, no auth needed). Examples:
  - Linus Torvalds (`torvalds`) — Linux creator
  - Evan You (`yyx990803`) — Vue.js creator
  - Guillermo Rauch (`rauchg`) — Vercel CEO
  - Sindre Sorhus (`sindresorhus`) — prolific OSS contributor
  - TJ Holowaychuk (`tj`) — Express.js creator
  - User can type any public GitHub username to preview (fallback/demo mode without sign-in)
- These grids are pre-generated at build time (ISR, revalidate weekly) and served as static data
- Footer: links, language selector

### 2. Onboarding (first visit after auth)

If birthdate is not set, `/dashboard` shows an inline onboarding form:
- Date of birth picker (required)
- Gender + country selects (for baseline life expectancy)
- "Start" button -> saves and renders grid
- Optional: "Customize life expectancy" link to full calculator in `/settings`

### 3. Dashboard (`/dashboard`)

**Authenticated state. Main view. Requires birthdate to be set.**

**Header:**
- GitHub avatar + username
- Theme toggle (system default, manual override)
- Language selector (7 languages)
- Settings link
- Sign out

**Life Grid (SVG):**
- 52 columns (weeks) x N rows (years, based on expected lifespan)
- Y-axis: age (0, 5, 10, 15... labeled every 5 years)
- X-axis: week of year (1-52, labeled every 10)
- Each cell is a small square (~6-8px on desktop, ~4-5px on mobile)

**Cell states:**
| State | Color (dark theme) | Color (light theme) |
|-------|-------------------|---------------------|
| Future (empty) | `stroke: #30363d` | `stroke: #d0d7de` |
| Pre-GitHub (lived, no GitHub account yet) | `fill: #161b22` | `fill: #f6f8fa` |
| Lived, no commits | `fill: #21262d` | `fill: #ebedf0` |
| Lived, 1-3 commits | `fill: #0e4429` | `fill: #9be9a8` |
| Lived, 4-9 commits | `fill: #006d32` | `fill: #40c463` |
| Lived, 10-19 commits | `fill: #26a641` | `fill: #30a14e` |
| Lived, 20+ commits | `fill: #39d353` | `fill: #216e39` |
| Current week | `stroke: #f0883e` (highlight) | `stroke: #e16f24` |

**Tooltip on hover/tap:**
- Date range of the week (e.g., "Jan 6 - Jan 12, 2024")
- Age at that time (e.g., "Age 31, Week 2")
- Number of commits (e.g., "14 commits")

**Stats panel (below or beside grid):**
- Total weeks lived / total expected
- Percentage of life lived
- "Active" weeks (with commits) / total lived weeks
- Current streak (consecutive weeks with commits)
- Longest streak

### 4. Settings (`/settings`)

**Birth date** (required) — date picker

**Life expectancy calculator:**

Base: country + gender -> World Bank API data (217 countries, 2023, ~15KB static JSON)

**Data source:** World Bank indicators `SP.DYN.LE00.MA.IN` (male) / `SP.DYN.LE00.FE.IN` (female).
Pre-fetched at build time into `public/data/life-expectancy.json` as `{iso3: {name, male, female}}`.
Refreshed annually via ISR or manual rebuild.

Optional factors (each with info icon linking to source study):

| Factor | Input type | Impact | Source |
|--------|-----------|--------|--------|
| Smoking | select: never / quit before 35 / quit 35-54 / quit 55+ / current | never: 0, quit<35: -1, quit 35-54: -4, quit 55+: -7, current: -11 | Jha et al., NEJM 2013, DOI: 10.1056/NEJMsa1211128 |
| Alcohol | select: none / moderate / heavy | none: 0, moderate: 0, heavy: -7 | Nature Sci Reports 2022, DOI: 10.1038/s41598-022-11427-x |
| Physical activity | select: sedentary / light / moderate / active | sedentary: -3, light: 0, moderate: +2, active: +4 | Moore et al., PLoS Medicine 2012, DOI: 10.1371/journal.pmed.1001335 |
| Height + Weight | number inputs -> auto BMI | normal: 0, overweight: -1, obese I: -3, obese II+: -8 | Lancet Diabetes & Endocrinology 2018, DOI: 10.1016/S2213-8587(18)30288-2 |
| Sleep | select: <6h / 6-7h / 7-8h / 9h+ | <6h: -1, 6-7h: 0, 7-8h: 0, 9h+: -2 | Cappuccio et al., Sleep 2010, DOI: 10.1093/sleep/33.5.585 |
| Diet quality | select: poor / average / good / excellent | poor: -4, average: 0, good: +3, excellent: +6 | Fadnes et al., PLoS Medicine 2022, DOI: 10.1371/journal.pmed.1003889 |
| Social connections | select: isolated / some / strong | isolated: -5, some: 0, strong: +2 | Holt-Lunstad, PLoS Medicine 2010, DOI: 10.1371/journal.pmed.1000316 |
| Diabetes | select: no / type 2 (age of diagnosis) | no: 0, type2 <40: -12, type2 40-50: -8, type2 50+: -5 | Lancet 2022, DOI: 10.1016/S2213-8587(22)00252-2 |
| Family history | checkbox: parent lived to 85+ | yes: +2.5 | New England Centenarian Study |
| Stress level | select: low / moderate / high / severe | low: +1, moderate: 0, high: -1.5, severe: -2.5 | Finnish Institute for Health, 2020; Yale Translational Psychiatry 2021 |
| Education | select: <HS / HS / college / bachelor / graduate | <HS: -4, HS: -2, college: 0, bachelor: +1.5, graduate: +2.5 | Lancet Public Health 2024, DOI: 10.1016/S2468-2667(23)00306-7 |
| Marital status | select: married / cohabiting / divorced / widowed / single | married: +2.5, cohabiting: +1, divorced: -1, widowed: -1, single: -2 | PMC2566023; PMC7452000 |
| Hypertension | select: normal / elevated / stage1 / stage2+ / unknown | normal: +1, elevated: 0, stage1: -1.5, stage2+: -3, unknown: -1 | Franco et al., Hypertension 2005 (Framingham) |
| Heart disease/cancer | multi-select: none / cancer remission / heart disease / active cancer | none: 0, remission: -2, heart disease: -5, active cancer: -10 | PubMed 25023914; NEJM 2024 |
| Depression | select: none / mild managed / moderate / severe | none: 0, mild: -1, moderate: -3, severe: -6 | Lancet eClinicalMedicine 2023 |
| Sitting time | select: <4h / 4-6h / 7-9h / 10+h per day | <4h: +1, 4-6h: 0, 7-9h: -1, 10+: -2 | Katzmarzyk & Lee, BMJ Open 2012, PMC3400064 |
| Optimism | select: very / somewhat / neutral / pessimistic | very: +2, somewhat: +1, neutral: 0, pessimistic: -1.5 | Lee et al., PNAS 2019 |
| Purpose in life | select: strong / moderate / uncertain / none | strong: +2, moderate: +1, uncertain: 0, none: -1.5 | Hill & Turiano, Psychol Sci 2014, PMC4224996 |
| Coffee | select: 0 / 1-2 / 3-4 / 5+ cups/day | 0: 0, 1-2: +1, 3-4: +0.5, 5+: 0 | Freedman et al., NEJM 2012 |
| Air pollution | select: clean / moderate / polluted / heavy | clean: +0.5, moderate: 0, polluted: -1, heavy: -2 | Apte et al., EST Letters 2018; AQLI 2024 |

**Algorithm:** Start with WHO baseline for country+gender, apply additive modifiers, cap at +/- 25 years from baseline. Display breakdown showing impact of each factor.

**Manual override:** Slider 50-110 years, always available regardless of calculator.

**Save** button -> stores to Upstash Redis.

## Data Model (Upstash Redis)

```
Key: user:{github_id}
Value: {
  githubId: string,
  githubUsername: string,
  birthDate: string (ISO),
  expectedAge: number,
  calculatorAnswers: {
    gender: "male" | "female",
    country: string (ISO 3166-1),
    smoking: "never" | "quit_before_35" | "quit_35_54" | "quit_55plus" | "current",
    alcohol: "none" | "moderate" | "heavy",
    activity: "sedentary" | "moderate" | "active",
    height: number (cm),
    weight: number (kg),
    sleep: "<6" | "6-7" | "7-8" | "9+",
    diet: "poor" | "average" | "good" | "excellent",
    social: "isolated" | "some" | "strong",
    diabetes: "no" | "type2_under40" | "type2_40_50" | "type2_over50",
    familyLongevity: boolean,
    stress: "low" | "moderate" | "high" | "severe",
    education: "less_hs" | "hs" | "college" | "bachelor" | "graduate",
    maritalStatus: "married" | "cohabiting" | "divorced" | "widowed" | "single",
    hypertension: "normal" | "elevated" | "stage1" | "stage2" | "unknown",
    heartDiseaseCancer: string[],  // ["none"] | ["cancer_remission", "heart_disease", ...]
    depression: "none" | "mild" | "moderate" | "severe",
    sittingHours: "lt4" | "4_6" | "7_9" | "10plus",
    optimism: "very" | "somewhat" | "neutral" | "pessimistic",
    purpose: "strong" | "moderate" | "uncertain" | "none",
    coffee: "0" | "1_2" | "3_4" | "5plus",
    airPollution: "clean" | "moderate" | "polluted" | "heavy"
  } | null,
  createdAt: string (ISO),
  updatedAt: string (ISO)
}

Key: contributions:{github_id}:{year}
Value: {
  year: number,
  weeks: Array<{
    weekNumber: number,
    startDate: string,
    totalCommits: number
  }>
}
TTL: 24h (current year), 30 days (historical)
}

Key: github:meta:{github_id}
Value: {
  createdAt: string (ISO),  // GitHub account creation date
  avatarUrl: string
}
```

## i18n

7 languages, detected by `Accept-Language`, manual override stored in cookie:

| Code | Language |
|------|----------|
| en | English |
| zh | Chinese (Simplified) |
| es | Spanish |
| pt | Portuguese |
| ru | Russian |
| de | German |
| ja | Japanese |

Translation scope is minimal: UI labels, settings fields, tooltips, landing page copy. Calendar/date formatting via `Intl` API.

## Theming

- Default: follow `prefers-color-scheme` (system)
- Manual override via toggle in header, stored in cookie
- Two themes: dark (GitHub-dark inspired) and light
- Tailwind CSS v4 dark mode via `class` strategy

## Responsive Design

- Desktop: full grid visible, ~8px cells
- Tablet: ~6px cells
- Mobile: ~4-5px visual cells, but SVG `<rect>` hit area padded to ~12px for comfortable tapping
- Vertical scroll by years (age axis)
- Tap on cell -> popup with details (positioned above/below to avoid finger occlusion)

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...all]` | * | Better Auth handler |
| `/api/user` | GET | Get current user profile |
| `/api/user` | PUT | Update profile (birthdate, calculator answers) |
| `/api/contributions` | GET | Fetch & cache GitHub contributions |

## GitHub GraphQL Query

```graphql
query($from: DateTime!, $to: DateTime!) {
  viewer {
    createdAt
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}
```

### Fetching Strategy

- Use `viewer` (not `user(login:)`) — includes private repo contributions with `read:user` scope
- `contributionsCollection` supports max 1-year range per call
- **Step 1:** Fetch `contributionYears` — returns array of years with actual data (e.g. `[2026, 2025, 2024, ...]`). No guessing, no wasted calls for pre-GitHub years.
- **Step 2:** Batch years using GraphQL aliases (5 years per query):
  ```graphql
  { y2022: viewer { contributionsCollection(from: "2022-01-01T00:00:00Z", to: "2022-12-31T23:59:59Z") { ... } }
    y2023: viewer { contributionsCollection(from: "2023-01-01T00:00:00Z", to: "2023-12-31T23:59:59Z") { ... } } }
  ```
- Each batched query costs ~1 point. Rate limit: 5,000 points/hour.
- Pre-GitHub years get distinct "pre-GitHub" cell state (no API call needed).
- **Week mapping:** API returns up to 53 weeks per year (partial weeks at boundaries). Map contribution data to grid cells by actual date, not by week array index.
- **OAuth scope required:** `read:user` (for private contributions)
- **Loading UX:** Progress bar showing "Loading contributions... 2020, 2021, ..."
- **Error handling:** If a year fails, skip it and show "no data" for those weeks. Retry on next visit.

### Caching (KV TTL)

- **Current year:** 24h TTL (contributions still coming in)
- **Historical years (completed):** 30 days TTL (data never changes, but safety net for corrections)
- **On-demand refresh:** Button in UI to force re-fetch

## Week Numbering

Use simplified 52-week model (not ISO 8601). Each year has exactly 52 columns. Extra 1-2 days at year end are absorbed into week 52. This matches the visual grid and avoids week-53 edge cases. GitHub contribution data is mapped by actual dates to the corresponding week column.

## Error & Loading States

| State | Behavior |
|-------|----------|
| Grid loading (first visit) | Skeleton grid with shimmer animation + progress bar ("Loading 2019...") |
| GitHub API error | Show grid with available data, banner: "Some contribution data unavailable" |
| Upstash Redis unavailable | Fallback to in-memory session, no persistence until KV recovers |
| Token expired | Auto-refresh via Better Auth. If fails, redirect to re-auth |
| No birthdate set | Show onboarding form instead of grid |
| User has 0 contributions | Grid shows all lived weeks as gray "no commits", message encouraging first commit |

## Security

- GitHub token stored server-side only (Better Auth session + KV)
- No sensitive data in client bundle
- CSRF protection via Better Auth
- Rate limiting on API routes via Vercel Edge middleware

## Future Integrations (out of scope for MVP)

- Task trackers (Jira, Linear, Todoist) — color cells by completed tasks
- Health data (Apple Health, Google Fit)
- Calendar events (Google Calendar)
- Custom manual entries ("milestones")
- Share/export as image
- Public profile page
