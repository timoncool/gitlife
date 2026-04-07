<p align="center">
  <img src="app/icon.svg" width="80" height="80" alt="GitLife logo" />
</p>

<h1 align="center">GitLife</h1>

<p align="center">
  <strong>Your life is ~4,000 weeks. See them all in one grid.</strong>
</p>

<p align="center">
  <a href="https://gitlifeio.vercel.app">Live Demo</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#getting-started">Getting Started</a> &middot;
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <a href="https://gitlifeio.vercel.app"><img src="https://img.shields.io/badge/demo-live-brightgreen?style=flat-square" alt="Live Demo" /></a>
  <img src="https://img.shields.io/github/license/timoncool/gitlife?style=flat-square" alt="License" />
  <img src="https://img.shields.io/github/stars/timoncool/gitlife?style=flat-square" alt="Stars" />
  <img src="https://img.shields.io/badge/languages-7-blue?style=flat-square" alt="Languages" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
</p>

---

## What is this?

Every human life is roughly **4,000 weeks**. GitLife turns that number into a visual grid — one cell per week, from birth to estimated death. Your GitHub contributions are overlaid on top, so you can see which weeks you shipped code and which ones you didn't.

It's inspired by [Tim Urban's "Your Life in Weeks"](https://waitbutwhy.com/2014/05/life-weeks.html) and the GitHub contribution graph. The result is a sobering, beautiful, and surprisingly motivating way to look at your time on earth.

> **Try it now:** [gitlifeio.vercel.app](https://gitlifeio.vercel.app)

## Features

- **Life Grid** — ~4,000 cells from birth to expected death. Weeks/months/years scale selector.
- **GitHub Activity Overlay** — Your real commit history mapped onto your life timeline.
- **Life Expectancy Calculator** — 21 science-backed health factors with DOI-linked sources.
- **Compare With Legends** — 30 famous developers (Torvalds, Karpathy, Evan You, Dan Abramov...) with real GitHub data.
- **Leaderboard** — Community rankings + famous devs comparison. Sort by commits, streaks, active weeks.
- **7 Languages** — English, Chinese, Spanish, Portuguese, Russian, German, Japanese.
- **Dark/Light/System** theme with premium design.
- **Privacy-first** — No tracking, no ads. Your data stays yours.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Auth | [Better Auth](https://www.better-auth.com/) (GitHub OAuth) |
| Database | [Neon Postgres](https://neon.tech) + [Drizzle ORM](https://orm.drizzle.team) |
| UI | [shadcn/ui v4](https://ui.shadcn.com) + [Tailwind CSS v4](https://tailwindcss.com) |
| i18n | [next-intl](https://next-intl.dev) |
| Deploy | [Vercel](https://vercel.com) |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) database (free tier works)
- A [GitHub OAuth App](https://github.com/settings/developers)

### Setup

```bash
git clone https://github.com/timoncool/gitlife.git
cd gitlife
npm install
```

Create `.env.local`:

```env
DATABASE_URL=postgres://...
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_PAT=ghp_...  # optional, for higher API limits
```

Run database migrations:

```bash
npx drizzle-kit push
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. **Sign in with GitHub** — We fetch your public contribution history via the GitHub API.
2. **Enter your birth date** — The grid calculates your total weeks from birth to estimated death.
3. **See your life** — Green cells = weeks with commits. Gray = lived but no code. Empty = your future.
4. **Fine-tune with the calculator** — 21 health factors adjust your life expectancy estimate. Every factor links to a peer-reviewed study.
5. **Compare** — Browse grids of 30 famous developers. See how Torvalds' 55 years of coding compares to your journey.

## Famous Developers Included

Linus Torvalds (Linux) · Evan You (Vue.js) · Dan Abramov (React) · Andrej Karpathy (Tesla AI) · Ryan Dahl (Node.js/Deno) · Guido van Rossum (Python) · Brendan Eich (JavaScript) · Solomon Hykes (Docker) · Mitchell Hashimoto (Terraform) · Salvatore Sanfilippo (Redis) · Rich Harris (Svelte) · Sindre Sorhus (1000+ npm) · Guillermo Rauch (Vercel) · and 17 more...

## Contributing

Contributions are welcome! Here's how you can help:

- **Translations** — Add or improve translations in the `messages/` directory.
- **Famous Devs** — Know a developer who should be included? Open an issue with their public birth year and GitHub username.
- **Bug Fixes** — Check the issues tab for known bugs.
- **Features** — Ideas? Open a discussion first.

```bash
# Fork, clone, branch
git checkout -b feature/my-feature
npm run dev
# Make changes, commit, push, open PR
```

## License

MIT - do whatever you want with it.

---

<p align="center">
  <a href="https://gitlifeio.vercel.app">
    <strong>See your life grid &rarr;</strong>
  </a>
</p>
