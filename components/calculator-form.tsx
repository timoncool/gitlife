"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Info, ChevronRight, ChevronLeft, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";
import type { CalculatorAnswers, LifeExpectancyData } from "@/lib/types";

const ReactFlagsSelect = dynamic(() => import("react-flags-select"), { ssr: false });

// DOI URLs for study links
const FACTOR_URLS: Record<string, string | null> = {
  smoking: "https://doi.org/10.1056/NEJMsa1211128",
  alcohol: "https://doi.org/10.1038/s41598-022-11427-x",
  activity: "https://doi.org/10.1371/journal.pmed.1001335",
  sleep: "https://doi.org/10.1093/sleep/33.5.585",
  diet: "https://doi.org/10.1371/journal.pmed.1003889",
  social: "https://doi.org/10.1371/journal.pmed.1000316",
  stress: null, // Yale Translational Psychiatry 2021 — no DOI
  education: "https://doi.org/10.1016/S2468-2667(23)00306-7",
  maritalStatus: null,
  hypertension: null, // Framingham Heart Study, Hypertension 2005
  depression: null, // Lancet eClinicalMedicine 2023
  sittingHours: null,
  optimism: null, // Lee et al., PNAS 2019
  purpose: "https://doi.org/10.1177/0956797614531799",
  coffee: "https://doi.org/10.1056/NEJMoa1112010",
  airPollution: null, // AQLI 2024
  diabetes: "https://doi.org/10.1016/S2213-8587(22)00252-2",
};

// Factor option definitions with study sources
const FACTOR_OPTIONS: Record<
  string,
  { options: { value: string; labelKey: string }[]; source: string }
> = {
  smoking: {
    options: [
      { value: "never", labelKey: "smokingNever" },
      { value: "quit_before_35", labelKey: "smokingQuit35" },
      { value: "quit_35_54", labelKey: "smokingQuit3554" },
      { value: "quit_55plus", labelKey: "smokingQuit55" },
      { value: "current", labelKey: "smokingCurrent" },
    ],
    source:
      "Jha P. et al., NEJM 2013 — Smoking cessation before age 40 reduces excess mortality by ~90%.",
  },
  alcohol: {
    options: [
      { value: "none", labelKey: "alcoholNone" },
      { value: "moderate", labelKey: "alcoholModerate" },
      { value: "heavy", labelKey: "alcoholHeavy" },
    ],
    source:
      "GBD 2016 Alcohol Collaborators, Lancet 2018 — No safe level; heavy use reduces lifespan ~7 years.",
  },
  activity: {
    options: [
      { value: "sedentary", labelKey: "activitySedentary" },
      { value: "light", labelKey: "activityLight" },
      { value: "moderate", labelKey: "activityModerate" },
      { value: "active", labelKey: "activityActive" },
    ],
    source:
      "Arem H. et al., JAMA Internal Med 2015 — 150 min/week moderate activity adds ~3.4 years.",
  },
  sleep: {
    options: [
      { value: "lt6", labelKey: "sleepLt6" },
      { value: "6_7", labelKey: "sleep67" },
      { value: "7_8", labelKey: "sleep78" },
      { value: "9plus", labelKey: "sleep9plus" },
    ],
    source:
      "Cappuccio F. et al., Sleep 2010 — Short and long sleep durations associated with higher mortality.",
  },
  diet: {
    options: [
      { value: "poor", labelKey: "dietPoor" },
      { value: "average", labelKey: "dietAverage" },
      { value: "good", labelKey: "dietGood" },
      { value: "excellent", labelKey: "dietExcellent" },
    ],
    source:
      "Sofi F. et al., BMJ 2008 — Mediterranean diet associated with +4-6 years life expectancy.",
  },
  social: {
    options: [
      { value: "isolated", labelKey: "socialIsolated" },
      { value: "some", labelKey: "socialSome" },
      { value: "strong", labelKey: "socialStrong" },
    ],
    source:
      "Holt-Lunstad J. et al., PLoS Medicine 2010 — Social isolation comparable to smoking 15 cigarettes/day.",
  },
  stress: {
    options: [
      { value: "low", labelKey: "stressLow" },
      { value: "moderate", labelKey: "stressModerate" },
      { value: "high", labelKey: "stressHigh" },
      { value: "severe", labelKey: "stressSevere" },
    ],
    source:
      "Kivimaki M. et al., BMJ 2012 — Chronic stress associated with 40% increased CVD mortality.",
  },
  education: {
    options: [
      { value: "less_hs", labelKey: "educationLessHs" },
      { value: "hs", labelKey: "educationHs" },
      { value: "college", labelKey: "educationCollege" },
      { value: "bachelor", labelKey: "educationBachelor" },
      { value: "graduate", labelKey: "educationGraduate" },
    ],
    source:
      "Hummer R. & Hernandez E., Demography 2013 — Education-mortality gradient ~4 years between HS and college.",
  },
  maritalStatus: {
    options: [
      { value: "married", labelKey: "maritalMarried" },
      { value: "cohabiting", labelKey: "maritalCohabiting" },
      { value: "divorced", labelKey: "maritalDivorced" },
      { value: "widowed", labelKey: "maritalWidowed" },
      { value: "single", labelKey: "maritalSingle" },
    ],
    source:
      "Roelfs D. et al., Soc Sci Med 2011 — Marriage associated with ~2.5 years increased longevity.",
  },
  hypertension: {
    options: [
      { value: "normal", labelKey: "hypertensionNormal" },
      { value: "elevated", labelKey: "hypertensionElevated" },
      { value: "stage1", labelKey: "hypertensionStage1" },
      { value: "stage2", labelKey: "hypertensionStage2" },
      { value: "unknown", labelKey: "hypertensionUnknown" },
    ],
    source:
      "Lewington S. et al., Lancet 2002 — Each 20mmHg systolic increase doubles CVD mortality.",
  },
  depression: {
    options: [
      { value: "none", labelKey: "depressionNone" },
      { value: "mild", labelKey: "depressionMild" },
      { value: "moderate", labelKey: "depressionModerate" },
      { value: "severe", labelKey: "depressionSevere" },
    ],
    source:
      "Cuijpers P. et al., Arch Gen Psychiatry 2014 — Depression linked to 1.5-6 year reduction.",
  },
  sittingHours: {
    options: [
      { value: "lt4", labelKey: "sittingLt4" },
      { value: "4_6", labelKey: "sitting46" },
      { value: "7_9", labelKey: "sitting79" },
      { value: "10plus", labelKey: "sitting10plus" },
    ],
    source:
      "Chau J. et al., Int J Behav Nutr 2013 — Sitting >8h/day with no exercise: 60% higher mortality.",
  },
  optimism: {
    options: [
      { value: "very", labelKey: "optimismVery" },
      { value: "somewhat", labelKey: "optimismSomewhat" },
      { value: "neutral", labelKey: "optimismNeutral" },
      { value: "pessimistic", labelKey: "optimismPessimistic" },
    ],
    source:
      "Lee L. et al., PNAS 2019 — High optimism associated with 11-15% longer lifespan.",
  },
  purpose: {
    options: [
      { value: "strong", labelKey: "purposeStrong" },
      { value: "moderate", labelKey: "purposeModerate" },
      { value: "uncertain", labelKey: "purposeUncertain" },
      { value: "none", labelKey: "purposeNone" },
    ],
    source:
      "Alimujiang A. et al., JAMA Network Open 2019 — Strong purpose linked to ~2 year gain.",
  },
  coffee: {
    options: [
      { value: "0", labelKey: "coffeeNone" },
      { value: "1_2", labelKey: "coffee12" },
      { value: "3_4", labelKey: "coffee34" },
      { value: "5plus", labelKey: "coffee5plus" },
    ],
    source:
      "Loftfield E. et al., JAMA Internal Med 2018 — 2-3 cups/day associated with lower all-cause mortality.",
  },
  airPollution: {
    options: [
      { value: "clean", labelKey: "airClean" },
      { value: "moderate", labelKey: "airModerate" },
      { value: "polluted", labelKey: "airPolluted" },
      { value: "heavy", labelKey: "airHeavy" },
    ],
    source:
      "Lelieveld J. et al., Cardiovascular Research 2020 — PM2.5 exposure reduces lifespan ~1-2 years.",
  },
  diabetes: {
    options: [
      { value: "no", labelKey: "diabetesNo" },
      { value: "type2_under40", labelKey: "diabetesUnder40" },
      { value: "type2_40_50", labelKey: "diabetes4050" },
      { value: "type2_over50", labelKey: "diabetesOver50" },
    ],
    source:
      "Emerging Risk Factors Collab., NEJM 2011 — Diabetes at age 40 reduces lifespan ~6-12 years.",
  },
};

const CONDITION_OPTIONS = [
  { value: "heart_disease", labelKey: "conditionHeart" },
  { value: "active_cancer", labelKey: "conditionCancerActive" },
  { value: "cancer_remission", labelKey: "conditionCancerRemission" },
];

// Wizard steps with factor groupings
const WIZARD_STEPS = [
  {
    key: "basic",
    titleKey: "sectionBasic",
    factors: [], // handled manually: birthDate, gender, country
  },
  {
    key: "lifestyle",
    titleKey: "sectionLifestyle",
    factors: ["smoking", "alcohol", "activity", "sleep", "diet", "coffee"],
    hasBMI: true,
  },
  {
    key: "medical",
    titleKey: "sectionMedical",
    factors: ["diabetes", "hypertension", "depression"],
    hasConditions: true,
  },
  {
    key: "social",
    titleKey: "sectionSocial",
    factors: ["social", "maritalStatus", "education", "stress", "optimism", "purpose"],
  },
  {
    key: "environmental",
    titleKey: "sectionEnvironmental",
    factors: ["airPollution", "sittingHours"],
  },
  {
    key: "family",
    titleKey: "sectionFamily",
    factors: [], // handled manually: familyLongevity
  },
  {
    key: "results",
    titleKey: "sectionResults",
    factors: [],
  },
];

const TOTAL_STEPS = WIZARD_STEPS.length; // 7 steps (0-6)

// Modifier lookup for real-time preview
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

const CONDITION_MODIFIERS: Record<string, number> = {
  active_cancer: -10,
  heart_disease: -5,
  cancer_remission: -2,
};

function getBMIModifier(bmi: number): number {
  if (bmi < 18.5) return -4;
  if (bmi < 25) return 0;
  if (bmi < 30) return -1;
  if (bmi < 35) return -3;
  return -8;
}

interface CalculatorFormProps {
  mode?: "wizard" | "full";
  initialValues?: Partial<CalculatorAnswers>;
  initialBirthDate?: string | null;
  onSaved?: () => void;
  onComplete?: () => void;
}

export function CalculatorForm({ mode = "wizard", initialValues, initialBirthDate, onSaved, onComplete }: CalculatorFormProps) {
  const tf = useTranslations("factors");
  const tc = useTranslations("calculator");

  const [step, setStep] = useState(0);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  // Form state
  const [birthDate, setBirthDate] = useState(initialBirthDate ?? "");
  const [sex, setSex] = useState(initialValues?.sex ?? "");
  const [country, setCountry] = useState(initialValues?.country ?? "");
  const [height, setHeight] = useState(initialValues?.height?.toString() ?? "");
  const [weight, setWeight] = useState(initialValues?.weight?.toString() ?? "");
  const [familyLongevity, setFamilyLongevity] = useState(
    initialValues?.familyLongevity ?? false,
  );
  const [conditions, setConditions] = useState<string[]>(
    initialValues?.conditions ?? [],
  );
  const [manualOverride, setManualOverride] = useState<number | null>(null);

  // Factor values
  const [factorValues, setFactorValues] = useState<Record<string, string>>(
    () => {
      const init: Record<string, string> = {};
      const allFactors = WIZARD_STEPS.flatMap((s) => s.factors);
      for (const factor of allFactors) {
        init[factor] =
          (initialValues?.[factor as keyof CalculatorAnswers] as string) ?? "";
      }
      return init;
    },
  );

  useEffect(() => {
    Promise.all([
      fetch("/data/life-expectancy.json").then((r) => r.json()),
      import("i18n-iso-countries").then(async (mod) => {
        // Register locale dynamically
        const lang = document.documentElement.lang || "en";
        try {
          const localeData = await import(`i18n-iso-countries/langs/${lang}.json`);
          mod.registerLocale(localeData);
        } catch {
          const enData = await import("i18n-iso-countries/langs/en.json");
          mod.registerLocale(enData);
        }
        return mod;
      }),
    ]).then(([data, countries_lib]: [LifeExpectancyData, typeof import("i18n-iso-countries")]) => {
      const lang = document.documentElement.lang || "en";
      const list = Object.entries(data)
        .map(([iso3, entry]) => {
          const name = countries_lib.getName(iso3, lang, { select: "official" })
            || countries_lib.getName(iso3, "en", { select: "official" })
            || entry.name;
          return { code: iso3, name };
        })
        .sort((a, b) => a.name.localeCompare(b.name, lang));
      setCountries(list);
    });
  }, []);

  // BMI calculation
  const bmi = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      return w / ((h / 100) * (h / 100));
    }
    return null;
  }, [height, weight]);

  const getBMICategory = (bmiVal: number): string => {
    if (bmiVal < 18.5) return tc("bmiUnderweight");
    if (bmiVal < 25) return tc("bmiNormal");
    if (bmiVal < 30) return tc("bmiOverweight");
    if (bmiVal < 35) return tc("bmiObese1");
    return tc("bmiObese2");
  };

  // ISO3 -> ISO2 mapping for ReactFlagsSelect
  const [iso3ToIso2, setIso3ToIso2] = useState<Record<string, string>>({});
  const [iso2ToIso3, setIso2ToIso3] = useState<Record<string, string>>({});

  useEffect(() => {
    import("i18n-iso-countries").then((mod) => {
      const map3to2: Record<string, string> = {};
      const map2to3: Record<string, string> = {};
      for (const c of countries) {
        const iso2 = mod.alpha3ToAlpha2(c.code);
        if (iso2) {
          map3to2[c.code] = iso2;
          map2to3[iso2] = c.code;
        }
      }
      setIso3ToIso2(map3to2);
      setIso2ToIso3(map2to3);
    });
  }, [countries]);

  // Filtered countries for search
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    const q = countrySearch.toLowerCase();
    return countries.filter((c) => c.name.toLowerCase().includes(q));
  }, [countries, countrySearch]);

  // Baseline from country
  const [lifeData, setLifeData] = useState<Record<string, { name: string; male: number; female: number }> | null>(null);
  useEffect(() => {
    fetch("/data/life-expectancy.json")
      .then((res) => res.json())
      .then((data) => setLifeData(data));
  }, []);

  const baseline = useMemo(() => {
    if (!lifeData || !country || !sex) return 75;
    const cd = lifeData[country];
    if (cd) return cd[sex as "male" | "female"];
    return sex === "male" ? 73 : 79;
  }, [lifeData, country, sex]);

  // Impact calculation
  const impacts = useMemo(() => {
    const result: { factor: string; modifier: number }[] = [];

    for (const [factor, value] of Object.entries(factorValues)) {
      if (!value) continue;
      const mod = MODIFIERS[factor]?.[value];
      if (mod !== undefined && mod !== 0) {
        result.push({ factor, modifier: mod });
      }
    }

    if (bmi !== null) {
      const bmiMod = getBMIModifier(bmi);
      if (bmiMod !== 0) {
        result.push({ factor: "bmi", modifier: bmiMod });
      }
    }

    if (familyLongevity) {
      result.push({ factor: "familyLongevity", modifier: 2.5 });
    }

    // Conditions
    if (conditions.length > 0) {
      let condMod: number;
      if (conditions.includes("active_cancer")) {
        condMod = CONDITION_MODIFIERS["active_cancer"];
      } else {
        condMod = conditions.reduce((sum, c) => sum + (CONDITION_MODIFIERS[c] ?? 0), 0);
      }
      if (condMod !== 0) {
        result.push({ factor: "conditions", modifier: condMod });
      }
    }

    return result;
  }, [factorValues, bmi, familyLongevity, conditions]);

  const totalImpact = impacts.reduce((sum, i) => sum + i.modifier, 0);
  const cappedImpact = Math.max(-25, Math.min(25, totalImpact));
  const calculatedAge = Math.round((baseline + cappedImpact) * 10) / 10;

  function setFactor(factor: string, value: string | null) {
    if (!value) return;
    setFactorValues((prev) => ({ ...prev, [factor]: value }));
  }

  function toggleCondition(value: string) {
    setConditions((prev) =>
      prev.includes(value)
        ? prev.filter((c) => c !== value)
        : [...prev, value],
    );
  }

  // Factor label resolver
  const factorLabel = useCallback(
    (factor: string): string => {
      const map: Record<string, string> = {
        smoking: tf("smoking"),
        alcohol: tf("alcohol"),
        activity: tf("activity"),
        sleep: tf("sleep"),
        diet: tf("diet"),
        social: tf("social"),
        stress: tf("stress"),
        education: tf("education"),
        maritalStatus: tf("marital"),
        hypertension: tf("hypertension"),
        depression: tf("depression"),
        sittingHours: tf("sitting"),
        optimism: tf("optimism"),
        purpose: tf("purpose"),
        coffee: tf("coffee"),
        airPollution: tf("airPollution"),
        diabetes: tf("diabetes"),
        bmi: tf("bmi"),
        familyLongevity: tf("familyLongevity"),
        conditions: tf("conditions"),
        family: tf("family"),
      };
      return map[factor] ?? factor;
    },
    [tf],
  );

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const calculatorAnswers: Record<string, unknown> = {
        sex,
        country,
        height: parseFloat(height) || 0,
        weight: parseFloat(weight) || 0,
        familyLongevity,
        conditions,
        ...factorValues,
      };
      const finalAge = manualOverride ?? Math.round(calculatedAge);
      const body: Record<string, unknown> = {
        calculatorAnswers,
        expectedAge: finalAge,
        birthDate: birthDate || undefined,
      };
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaved(true);
        onSaved?.();
        if (onComplete) {
          onComplete();
        } else {
          setTimeout(() => setSaved(false), 2000);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  // Render info popover with DOI link
  function renderInfoPopover(factor: string) {
    const config = FACTOR_OPTIONS[factor];
    if (!config) return null;
    const url = FACTOR_URLS[factor];
    return (
      <Popover>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          }
        />
        <PopoverContent className="text-xs max-w-[300px]" side="top">
          <span>{config.source}</span>
          {url && (
            <>
              {" "}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                DOI
              </a>
            </>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  // Render a select factor
  function renderFactor(factor: string) {
    const config = FACTOR_OPTIONS[factor];
    if (!config) return null;
    return (
      <div key={factor} className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm font-medium">{factorLabel(factor)}</Label>
          {renderInfoPopover(factor)}
        </div>
        <Select
          value={factorValues[factor] ?? ""}
          onValueChange={(v) => setFactor(factor, v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={factorLabel(factor)}>
              {factorValues[factor]
                ? tc(config.options.find((o) => o.value === factorValues[factor])?.labelKey || factor)
                : factorLabel(factor)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {config.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {tc(opt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100;
  const currentStep = WIZARD_STEPS[step];

  // Shared section renderers
  function renderBasicSection() {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label>{tc("birthDate")}</Label>
          <Input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{tc("gender")}</Label>
          <Select value={sex} onValueChange={(v) => { if (v) setSex(v); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={tc("gender")}>
                {sex ? tc(sex === "male" ? "male" : "female") : tc("gender")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{tc("male")}</SelectItem>
              <SelectItem value="female">{tc("female")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>{tc("country")}</Label>
          <ReactFlagsSelect
            selected={iso3ToIso2[country] || ""}
            onSelect={(iso2: string) => {
              const iso3 = iso2ToIso3[iso2];
              if (iso3) setCountry(iso3);
            }}
            searchable
            searchPlaceholder={tc("searchCountry")}
            className="country-flags-select"
          />
        </div>
      </div>
    );
  }

  function renderLifestyleSection() {
    const lifestyleStep = WIZARD_STEPS[1];
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {lifestyleStep.factors.map((factor) => renderFactor(factor))}
        </div>
        <Separator />
        <div className="flex flex-col gap-4">
          <Label className="text-sm font-medium">{tc("bmiLabel")}</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">{tc("height")}</Label>
              <Input
                type="number"
                min={100}
                max={250}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">{tc("weight")}</Label>
              <Input
                type="number"
                min={30}
                max={300}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                className="w-full"
              />
            </div>
          </div>
          {bmi !== null && (
            <div className="text-sm">
              {tc("bmiLabel")}: <span className="font-bold">{bmi.toFixed(1)}</span>{" "}
              <span className="text-muted-foreground">({getBMICategory(bmi)})</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderMedicalSection() {
    const medicalStep = WIZARD_STEPS[2];
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {medicalStep.factors.map((factor) => renderFactor(factor))}
        </div>
        <Separator />
        <div className="flex flex-col gap-3">
          <Label className="text-sm font-medium">{tf("heartCancer")}</Label>
          {CONDITION_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={conditions.includes(opt.value)}
                onChange={() => toggleCondition(opt.value)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm">{tc(opt.labelKey)}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  function renderSocialSection() {
    const socialStep = WIZARD_STEPS[3];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {socialStep.factors.map((factor) => renderFactor(factor))}
      </div>
    );
  }

  function renderEnvironmentalSection() {
    const envStep = WIZARD_STEPS[4];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {envStep.factors.map((factor) => renderFactor(factor))}
      </div>
    );
  }

  function renderFamilySection() {
    return (
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border hover:bg-muted/50 transition-colors">
          <input
            type="checkbox"
            checked={familyLongevity}
            onChange={(e) => setFamilyLongevity(e.target.checked)}
            className="h-5 w-5 rounded border-input"
          />
          <span className="text-base">{tc("familyLongevity")}</span>
        </label>
      </div>
    );
  }

  function renderResultsSection() {
    return (
      <div className="flex flex-col gap-6">
        {/* Main calculated age */}
        <div className="text-center py-6">
          <div className="text-6xl font-bold text-green-600 dark:text-green-400">
            {manualOverride ?? Math.round(calculatedAge)}
          </div>
          <div className="text-lg text-muted-foreground mt-2">
            {tc("calculatedAge")}
          </div>
          {sex && country && (
            <div className="text-sm text-muted-foreground mt-1">
              {tc("baselineAge")}: {baseline}
            </div>
          )}
        </div>

        <Separator />

        {/* Breakdown */}
        {impacts.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              {tc("totalImpact")}
            </h3>

            {impacts.filter((i) => i.modifier > 0).length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {tc("positiveFactors")}
                </span>
                {impacts
                  .filter((i) => i.modifier > 0)
                  .sort((a, b) => b.modifier - a.modifier)
                  .map((item) => (
                    <div key={item.factor} className="flex items-center justify-between text-sm pl-2">
                      <span>{factorLabel(item.factor)}</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        +{item.modifier}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {impacts.filter((i) => i.modifier < 0).length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {tc("negativeFactors")}
                </span>
                {impacts
                  .filter((i) => i.modifier < 0)
                  .sort((a, b) => a.modifier - b.modifier)
                  .map((item) => (
                    <div key={item.factor} className="flex items-center justify-between text-sm pl-2">
                      <span>{factorLabel(item.factor)}</span>
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {item.modifier}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            <Separator className="my-2" />
            <div className="flex items-center justify-between font-bold text-base">
              <span>{tc("total")}</span>
              <span className={cappedImpact >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                {cappedImpact > 0 ? "+" : ""}{cappedImpact.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        <Separator />

        {/* Manual override */}
        <div className="flex flex-col gap-3">
          <Label className="text-sm text-muted-foreground">
            {tc("orEnterManually")}
          </Label>
          <Slider
            min={50}
            max={110}
            step={1}
            value={[manualOverride ?? Math.round(calculatedAge)]}
            onValueChange={(val) => {
              const v = Array.isArray(val) ? val[0] : val;
              setManualOverride(v);
            }}
          />
          <div className="text-center text-sm text-muted-foreground">
            {manualOverride ?? Math.round(calculatedAge)}
          </div>
          {manualOverride !== null && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setManualOverride(null)}
              className="self-center"
            >
              {tc("useCalculator")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ─── FULL MODE ─────────────────────────────────────────────────────────────
  if (mode === "full") {
    const sections = [
      { key: "basic", titleKey: "sectionBasic", render: renderBasicSection },
      { key: "lifestyle", titleKey: "sectionLifestyle", render: renderLifestyleSection },
      { key: "medical", titleKey: "sectionMedical", render: renderMedicalSection },
      { key: "social", titleKey: "sectionSocial", render: renderSocialSection },
      { key: "environmental", titleKey: "sectionEnvironmental", render: renderEnvironmentalSection },
      { key: "family", titleKey: "sectionFamily", render: renderFamilySection },
    ];

    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {sections.map((section) => (
          <Card key={section.key} className="overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-5">{tc(section.titleKey)}</h2>
              {section.render()}
            </CardContent>
          </Card>
        ))}

        {/* Results / Impact preview */}
        <Card className="overflow-hidden border-green-500/30">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-5">{tc("sectionResults")}</h2>
            {renderResultsSection()}
          </CardContent>
        </Card>

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500"
        >
          {saved ? tc("saved") : saving ? tc("saving") : tc("save")}
        </Button>
      </div>
    );
  }

  // ─── WIZARD MODE ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {tc("stepOf", { current: step + 1, total: TOTAL_STEPS })}
          </span>
          <span>{tc(currentStep.titleKey)}</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-6">{tc(currentStep.titleKey)}</h2>

          {step === 0 && <div className="animate-in fade-in duration-300">{renderBasicSection()}</div>}
          {step === 1 && <div className="animate-in fade-in duration-300">{renderLifestyleSection()}</div>}
          {step === 2 && <div className="animate-in fade-in duration-300">{renderMedicalSection()}</div>}
          {step === 3 && <div className="animate-in fade-in duration-300">{renderSocialSection()}</div>}
          {step === 4 && <div className="animate-in fade-in duration-300">{renderEnvironmentalSection()}</div>}
          {step === 5 && <div className="animate-in fade-in duration-300">{renderFamilySection()}</div>}

          {/* Step 6: Results */}
          {step === 6 && (
            <div className="animate-in fade-in duration-300">
              {renderResultsSection()}
              {/* Save button */}
              <Button onClick={handleSave} disabled={saving} size="lg" className="w-full mt-6">
                {saved ? tc("saved") : saving ? tc("saving") : tc("save")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      {step < 6 && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {tc("back")}
          </Button>
          <Button
            onClick={() => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))}
            className="gap-1"
          >
            {tc("next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      {step === 6 && (
        <div className="flex items-center justify-start">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {tc("back")}
          </Button>
        </div>
      )}
    </div>
  );
}
