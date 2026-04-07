"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("landing");

  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold hover:text-foreground transition-colors">
              GitLife
            </Link>
            <span className="text-xs text-muted-foreground">{t("footerText")}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link>
            <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
            <a href="https://github.com/timoncool/commit-your-life" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
