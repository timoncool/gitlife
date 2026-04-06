"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">{t("welcome")}</h2>

      {/* Birth date */}
      <div className="flex flex-col gap-2">
        <Label>{t("birthDate")}</Label>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {birthDate ? format(birthDate, "PPP") : t("birthDate")}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={birthDate}
              onSelect={setBirthDate}
              defaultMonth={new Date(1990, 0)}
              fromYear={1920}
              toYear={new Date().getFullYear()}
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Gender */}
      <div className="flex flex-col gap-2">
        <Label>{t("gender")}</Label>
        <Select
          value={gender}
          onValueChange={(v) => { if (v) setGender(v); }}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("gender")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">{t("male")}</SelectItem>
            <SelectItem value="female">{t("female")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Country */}
      <div className="flex flex-col gap-2">
        <Label>{t("country")}</Label>
        <Select
          value={country}
          onValueChange={(v) => { if (v) setCountry(v); }}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("country")} />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!birthDate || !gender || !country || saving}
        size="lg"
      >
        {saving ? "..." : t("start")}
      </Button>

      <Link
        href="/settings"
        className="text-sm text-muted-foreground hover:text-foreground text-center"
      >
        {t("customize")}
      </Link>
    </div>
  );
}
