"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as Flags from "country-flag-icons/react/3x2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

const LANGUAGES = [
  { value: "en", label: "English", flagCode: "US" },
  { value: "zh", label: "中文", flagCode: "CN" },
  { value: "es", label: "Español", flagCode: "ES" },
  { value: "pt", label: "Português", flagCode: "BR" },
  { value: "ru", label: "Русский", flagCode: "RU" },
  { value: "de", label: "Deutsch", flagCode: "DE" },
  { value: "ja", label: "日本語", flagCode: "JP" },
] as const;

function FlagIcon({ code }: { code: string }) {
  const Flag = (Flags as Record<string, React.ComponentType<{ className?: string }>>)[code];
  if (!Flag) return null;
  return <Flag className="h-3 w-4 inline-block" />;
}

export function Footer() {
  const t = useTranslations("header");
  const tl = useTranslations("landing");

  const [currentLocale, setCurrentLocale] = useState("en");

  useEffect(() => {
    setCurrentLocale(document.documentElement.lang || "en");
  }, []);

  function handleLangChange(value: string) {
    document.cookie = `locale=${value};path=/;max-age=31536000;SameSite=Lax`;
    window.location.reload();
  }

  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-3">
            <Logo className="h-6 w-6" />
            <div>
              <span className="text-sm font-bold">GitLife</span>
              <p className="text-xs text-muted-foreground">{tl("tagline")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select defaultValue={currentLocale} onValueChange={handleLangChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue>
                  {(() => {
                    const lang = LANGUAGES.find(l => l.value === currentLocale);
                    if (!lang) return currentLocale;
                    return <span className="flex items-center gap-2"><FlagIcon code={lang.flagCode} />{lang.label}</span>;
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <span className="flex items-center gap-2"><FlagIcon code={lang.flagCode} />{lang.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">{t("home")}</Link>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">{t("dashboard")}</Link>
          <Link href="/leaderboard" className="hover:text-foreground transition-colors">{t("leaderboard")}</Link>
          <Link href="/settings" className="hover:text-foreground transition-colors">{t("settings")}</Link>
          <a href="https://github.com/timoncool/commit-your-life" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
        </div>

        <div className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} GitLife. Open source.
        </div>
      </div>
    </footer>
  );
}
