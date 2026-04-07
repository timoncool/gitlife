"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Menu, LogOut, LayoutDashboard, Settings, Search, Trophy, Home } from "lucide-react";
import * as Flags from "country-flag-icons/react/3x2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const LANGUAGES = [
  { value: "en", label: "English", flagCode: "US" },
  { value: "zh", label: "中文", flagCode: "CN" },
  { value: "es", label: "Español", flagCode: "ES" },
  { value: "pt", label: "Português", flagCode: "BR" },
  { value: "ru", label: "Русский", flagCode: "RU" },
  { value: "de", label: "Deutsch", flagCode: "DE" },
  { value: "ja", label: "日本語", flagCode: "JP" },
] as const;

function FlagIcon({ code, className }: { code: string; className?: string }) {
  const Flag = (Flags as Record<string, React.ComponentType<{ className?: string }>>)[code];
  if (!Flag) return null;
  return <Flag className={className || "h-3 w-4 inline-block"} />;
}

const ALLOWED_LOCALES = LANGUAGES.map((l) => l.value);

function LanguageSelector() {
  const currentLocale =
    typeof document !== "undefined"
      ? (document.documentElement.lang || "en")
      : "en";

  function handleChange(value: string | null) {
    if (!value || !ALLOWED_LOCALES.includes(value as typeof ALLOWED_LOCALES[number])) return;
    document.cookie = `locale=${value};path=/;max-age=31536000;SameSite=Lax`;
    window.location.reload();
  }

  return (
    <Select defaultValue={currentLocale} onValueChange={handleChange}>
      <SelectTrigger className="w-[160px]">
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
  );
}

function NavLinks({ className }: { className?: string }) {
  const t = useTranslations("header");

  return (
    <nav className={className}>
      <Link
        href="/"
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        {t("home")}
      </Link>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <LayoutDashboard className="h-4 w-4" />
        {t("dashboard")}
      </Link>
      <Link
        href="/leaderboard"
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Trophy className="h-4 w-4" />
        {t("leaderboard")}
      </Link>
      <Link
        href="/settings"
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings className="h-4 w-4" />
        {t("settings")}
      </Link>
    </nav>
  );
}

function HeaderSearch() {
  const router = useRouter();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const [value, setValue] = useState("");

  // Sync with URL on demo page, clear on other pages
  useEffect(() => {
    if (window.location.pathname === "/demo") {
      const params = new URLSearchParams(window.location.search);
      setValue(params.get("username") || "");
    } else {
      setValue("");
    }
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && value.trim()) {
      router.push(`/demo?username=${encodeURIComponent(value.trim())}`);
    }
  }

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="GitHub username"
        className="h-8 w-[180px] pl-8 text-sm"
      />
    </div>
  );
}

export function Header() {
  const t = useTranslations("header");
  const { data: session } = useSession();

  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Left: Logo + nav (desktop) */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            GitLife
          </Link>
          {user && (
            <NavLinks className="hidden md:flex items-center gap-4" />
          )}
        </div>

        {/* Right: desktop controls */}
        <div className="hidden md:flex items-center gap-3">
          <HeaderSearch />
          <LanguageSelector />
          <ThemeToggle />
          {user && (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                <AvatarFallback>
                  {(user.name ?? "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="gap-1"
              >
                <LogOut className="h-4 w-4" />
                {t("signOut")}
              </Button>
            </>
          )}
        </div>

        {/* Mobile: hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              }
            />
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>GitLife</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {user && (
                  <>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.image ?? undefined}
                          alt={user.name ?? ""}
                        />
                        <AvatarFallback>
                          {(user.name ?? "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.name}</span>
                    </div>
                    <Separator />
                    <NavLinks className="flex flex-col gap-3" />
                    <Separator />
                  </>
                )}
                <LanguageSelector />
                {user && (
                  <Button
                    variant="ghost"
                    className="justify-start gap-2"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("signOut")}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
