"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Sparkles, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { LifeExpectancyData } from "@/lib/types";
import Link from "next/link";

export function OnboardingForm() {
  const t = useTranslations("onboarding");
  const router = useRouter();

  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [gender, setGender] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [countries, setCountries] = useState<
    { code: string; name: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    fetch("/data/life-expectancy.json")
      .then((res) => res.json())
      .then((data: LifeExpectancyData) => {
        const list = Object.entries(data)
          .map(([code, entry]) => ({ code, name: entry.name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(list);
      });
  }, []);

  async function handleSubmit() {
    if (!birthDate || !gender || !country) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: birthDate.toISOString().split("T")[0],
          calculatorAnswers: { sex: gender, country },
        }),
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } finally {
      setSaving(false);
    }
  }

  // Calculate age preview
  const agePreview = birthDate
    ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  // Calculate weeks lived preview
  const weeksLived = birthDate
    ? Math.floor((Date.now() - birthDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Hero section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            {t("welcome")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            {t("welcome")}
          </h1>
          <p className="text-muted-foreground text-lg">
            Расскажи немного о себе, чтобы построить твою сетку жизни
          </p>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm p-8 shadow-2xl">
          {/* Glow effect */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          <div className="space-y-6">
            {/* Birth date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {t("birthDate")}
              </Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all text-left group"
                    >
                      <CalendarIcon className="w-5 h-5 text-emerald-400" />
                      <span className={birthDate ? "text-foreground" : "text-muted-foreground"}>
                        {birthDate ? format(birthDate, "d MMMM yyyy") : "Выберите дату..."}
                      </span>
                      {agePreview !== null && (
                        <span className="ml-auto text-sm text-emerald-400 font-medium">
                          {agePreview} лет
                        </span>
                      )}
                    </button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={(d) => { setBirthDate(d ?? undefined); if (d) setStep(1); }}
                    defaultMonth={new Date(1990, 0)}
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Gender - pill selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {t("gender")}
              </Label>
              <div className="flex gap-3">
                <button
                  onClick={() => { setGender("male"); setStep(2); }}
                  className={`flex-1 py-3 rounded-xl border text-center font-medium transition-all ${
                    gender === "male"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  ♂ {t("male")}
                </button>
                <button
                  onClick={() => { setGender("female"); setStep(2); }}
                  className={`flex-1 py-3 rounded-xl border text-center font-medium transition-all ${
                    gender === "female"
                      ? "border-pink-500 bg-pink-500/10 text-pink-400"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  ♀ {t("female")}
                </button>
              </div>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {t("country")}
              </Label>
              <Select
                value={country}
                onValueChange={(v) => { if (v) { setCountry(v); setStep(3); } }}
              >
                <SelectTrigger className="w-full py-3.5 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all">
                  <SelectValue placeholder="Выберите страну..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Weeks preview */}
            {weeksLived && (
              <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 p-4">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ты уже прожил</p>
                    <p className="text-2xl font-bold text-emerald-400">{weeksLived.toLocaleString()} недель</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!birthDate || !gender || !country || saving}
              size="lg"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="animate-pulse">Загрузка...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {t("start")} <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>

            <Link
              href="/settings"
              className="block text-sm text-muted-foreground hover:text-emerald-400 text-center transition-colors"
            >
              {t("customize")} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
