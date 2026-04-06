"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Menu, LogOut, LayoutDashboard, Settings } from "lucide-react";
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
import { signOut, useSession } from "@/lib/auth-client";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "ru", label: "Русский" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
] as const;

function LanguageSelector() {
  const currentLocale =
    typeof document !== "undefined"
      ? (document.cookie
          .split("; ")
          .find((c) => c.startsWith("locale="))
          ?.split("=")[1] ?? "en")
      : "en";

  function handleChange(value: string | null) {
    if (!value) return;
    document.cookie = `locale=${value};path=/;max-age=31536000`;
    window.location.reload();
  }

  return (
    <Select defaultValue={currentLocale} onValueChange={handleChange}>
      <SelectTrigger className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            {lang.label}
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
        href="/dashboard"
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <LayoutDashboard className="h-4 w-4" />
        {t("dashboard")}
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

export function Header() {
  const t = useTranslations("header");
  const { data: session } = useSession();

  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left: Logo + nav (desktop) */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Life in Weeks
          </Link>
          {user && (
            <NavLinks className="hidden md:flex items-center gap-4" />
          )}
        </div>

        {/* Right: desktop controls */}
        <div className="hidden md:flex items-center gap-3">
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
                <SheetTitle>Life in Weeks</SheetTitle>
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
