<p align="center">
  <img src="app/icon.svg" width="80" height="80" alt="GitLife logo" />
</p>

<h1 align="center">GitLife</h1>

<p align="center">
  <strong>Your life as a GitHub contribution graph.</strong>
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

The ["life in weeks"](https://waitbutwhy.com/2014/05/life-weeks.html) idea has been around for a while — your entire life fits into a grid of ~4,000 cells. GitLife overlays real GitHub commit history on top.

Enter any GitHub username in the search bar — no sign-up needed. Sign in with GitHub to include your private commits. The life expectancy calculator uses real country baselines from World Bank (217 countries) and 21 personal health factors from peer-reviewed studies.

> **Try it now:** [gitlifeio.vercel.app](https://gitlifeio.vercel.app)

## Features

- **Life Grid** — ~4,000 cells from birth to expected death. Weeks/months/years scale selector.
- **GitHub Commits** — Your real commit history mapped onto your life timeline.
- **Life Expectancy Calculator** — World Bank baseline (217 countries) + 21 health factors with DOI-linked sources.
- **30 Famous Developers** — Torvalds, Karpathy, Evan You, Dan Abramov and 26 others with real GitHub data.
- **Leaderboard** — Community rankings + famous devs. Sort by commits, streaks, active weeks.
- **7 Languages** — en, zh, es, pt, ru, de, ja.
- **Dark/Light/System** theme.
- **No tracking, no ads.** Sign in to save your profile and join the leaderboard.

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

```bash
npx drizzle-kit push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Famous Developers Included

Linus Torvalds (Linux) · Evan You (Vue.js) · Dan Abramov (React) · Andrej Karpathy (Tesla AI) · Ryan Dahl (Node.js/Deno) · Guido van Rossum (Python) · Brendan Eich (JavaScript) · Solomon Hykes (Docker) · Mitchell Hashimoto (Terraform) · Salvatore Sanfilippo (Redis) · Rich Harris (Svelte) · Sindre Sorhus (1000+ npm) · Guillermo Rauch (Vercel) · and 17 more...

## Contributing

The famous devs list, translations, and health factors are all plain JSON. Fork, edit, PR. The codebase is standard Next.js + TypeScript.

## Other Open Source by [@timoncool](https://github.com/timoncool)

| Project | Description |
|---------|------------|
| [videosos](https://github.com/timoncool/videosos) | AI video production in the browser (1.1K+ stars) |
| [Qwen3-TTS_portable_rus](https://github.com/timoncool/Qwen3-TTS_portable_rus) | Portable TTS with Qwen3 voice cloning |
| [Bulka](https://github.com/timoncool/Bulka) | Telegram bot framework |
| [VibeVoice_ASR_portable_ru](https://github.com/timoncool/VibeVoice_ASR_portable_ru) | Portable speech recognition |
| [telegram-api-mcp](https://github.com/timoncool/telegram-api-mcp) | Full Telegram Bot API as MCP server |
| [civitai-mcp-ultimate](https://github.com/timoncool/civitai-mcp-ultimate) | Civitai API as MCP server |
| [SuperCaption_Qwen3-VL](https://github.com/timoncool/SuperCaption_Qwen3-VL) | Image captioning with Qwen3 Vision |
| [LavaSR_portable_ru](https://github.com/timoncool/LavaSR_portable_ru) | Portable audio enhancement |
| [trail-spec](https://github.com/timoncool/trail-spec) | TRAIL — cross-MCP content tracking protocol |

## Support the Author

I build open-source software and do AI research. Most of what I create is free and available to everyone. Your donations help me keep creating without worrying about where the next meal comes from =)

**[All donation methods](https://github.com/timoncool/ACE-Step-Studio/blob/master/DONATE.md)** | **[dalink.to/nerual_dreming](https://dalink.to/nerual_dreming)** | **[boosty.to/neuro_art](https://boosty.to/neuro_art)**

| BTC | ETH (ERC20) | USDT (TRC20) |
|:---:|:---:|:---:|
| `1E7dHL22RpyhJGVpcvKdbyZgksSYkYeEBC` | `0xb5db65adf478983186d4897ba92fe2c25c594a0c` | `TQST9Lp2TjK6FiVkn4fwfGUee7NmkxEE7C` |


## Star History

<p align="center">
  <a href="https://star-history.com/#timoncool/gitlife&Date">
    <img src="https://api.star-history.com/svg?repos=timoncool/gitlife&type=Date" width="600" alt="Star History" />
  </a>
</p>

## License

MIT
