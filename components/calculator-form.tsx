"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { CalculatorAnswers, LifeExpectancyData } from "@/lib/types";

// Factor option definitions with study sources — labels are now translation keys
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

// Sections grouping
const SECTIONS = [
  { key: "lifestyle", factors: ["smoking", "alcohol", "activity", "sleep", "diet", "coffee"] },
  { key: "medical", factors: ["diabetes", "hypertension", "depression"] },
  { key: "social_section", factors: ["social", "maritalStatus", "education"] },
  { key: "psychological", factors: ["stress", "optimism", "purpose"] },
  { key: "environmental", factors: ["airPollution", "sittingHours"] },
];

const SECTION_LABEL_KEYS: Record<string, string> = {
  basic: "sectionBasic",
  lifestyle: "sectionLifestyle",
  medical: "sectionMedical",
  social_section: "sectionSocial",
  psychological: "sectionPsychological",
  environmental: "sectionEnvironmental",
  family: "sectionFamily",
};

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

function getBMIModifier(bmi: number): number {
  if (bmi < 18.5) return -4;
  if (bmi < 25) return 0;
  if (bmi < 30) return -1;
  if (bmi < 35) return -3;
  return -8;
}

interface CalculatorFormProps {
  initialValues?: Partial<CalculatorAnswers>;
}

export function CalculatorForm({ initialValues }: CalculatorFormProps) {
  const tf = useTranslations("factors");
  const ts = useTranslations("settings");
  const tc = useTranslations("calculator");

  const [countries, setCountries] = useState<{ code: string; name: string }[]>(
    [],
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
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
      for (const section of SECTIONS) {
        for (const factor of section.factors) {
          init[factor] =
            (initialValues?.[factor as keyof CalculatorAnswers] as string) ??
            "";
        }
      }
      return init;
    },
  );

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

  // BMI calculation
  const bmi = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      return w / ((h / 100) * (h / 100));
    }
    return null;
  }, [height, weight]);

  // BMI category using translations
  const getBMICategory = (bmiVal: number): string => {
    if (bmiVal < 18.5) return tc("bmiUnderweight");
    if (bmiVal < 25) return tc("bmiNormal");
    if (bmiVal < 30) return tc("bmiOverweight");
    if (bmiVal < 35) return tc("bmiObese1");
    return tc("bmiObese2");
  };

  // Real-time impact preview
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

    return result;
  }, [factorValues, bmi, familyLongevity]);

  const totalImpact = impacts.reduce((sum, i) => sum + i.modifier, 0);

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
      const body: Record<string, unknown> = { calculatorAnswers };
      if (manualOverride !== null) {
        body.expectedAge = manualOverride;
      }
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  // Factor label resolver
  const factorLabel = (factor: string): string => {
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
      familyLongevity: tf("family"),
    };
    return map[factor] ?? factor;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main form */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Basic section: gender + country */}
        <Card>
          <CardHeader>
            <CardTitle>{tc(SECTION_LABEL_KEYS.basic)}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>{tc("gender")}</Label>
              <Select
                value={sex}
                onValueChange={(v) => {
                  if (v) setSex(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tc("gender")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{tc("male")}</SelectItem>
                  <SelectItem value="female">{tc("female")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{tc("country")}</Label>
              <Select
                value={country}
                onValueChange={(v) => {
                  if (v) setCountry(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tc("country")} />
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
          </CardContent>
        </Card>

        {/* Factor sections */}
        {SECTIONS.map((section) => (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle>{tc(SECTION_LABEL_KEYS[section.key])}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.factors.map((factor) => {
                const config = FACTOR_OPTIONS[factor];
                if (!config) return null;
                return (
                  <div key={factor} className="flex flex-col gap-2">
                    <div className="flex items-center gap-1">
                      <Label>{factorLabel(factor)}</Label>
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
                        <PopoverContent
                          className="text-xs max-w-[300px]"
                          side="top"
                        >
                          {config.source}
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Select
                      value={factorValues[factor] ?? ""}
                      onValueChange={(v) => setFactor(factor, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={factorLabel(factor)} />
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
              })}
            </CardContent>
          </Card>
        ))}

        {/* BMI section */}
        <Card>
          <CardHeader>
            <CardTitle>{tc("bmiLabel")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>{tc("height")}</Label>
                <Input
                  type="number"
                  min={100}
                  max={250}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{tc("weight")}</Label>
                <Input
                  type="number"
                  min={30}
                  max={300}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                />
              </div>
            </div>
            {bmi !== null && (
              <div className="text-sm">
                {tc("bmiLabel")}: <span className="font-bold">{bmi.toFixed(1)}</span>{" "}
                <span className="text-muted-foreground">
                  ({getBMICategory(bmi)})
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Heart Disease / Cancer */}
        <Card>
          <CardHeader>
            <CardTitle>{tf("heartCancer")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {CONDITION_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={conditions.includes(opt.value)}
                  onChange={() => toggleCondition(opt.value)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">{tc(opt.labelKey)}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Family longevity */}
        <Card>
          <CardHeader>
            <CardTitle>{tf("family")}</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={familyLongevity}
                onChange={(e) => setFamilyLongevity(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm">{tc("familyLongevity")}</span>
            </label>
          </CardContent>
        </Card>

        {/* Manual override */}
        <Card>
          <CardHeader>
            <CardTitle>{ts("manualOverride")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Slider
              min={50}
              max={110}
              step={1}
              value={[manualOverride ?? 80]}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val;
                setManualOverride(v);
              }}
            />
            <div className="text-center text-lg font-bold">
              {manualOverride ?? 80} {ts("years")}
            </div>
            {manualOverride !== null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setManualOverride(null)}
              >
                {tc("useCalculator")}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Save */}
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saved ? ts("saved") : saving ? tc("saving") : tc("save")}
        </Button>
      </div>

      {/* Side panel: impact preview */}
      <div className="lg:col-span-1">
        <div className="sticky top-20">
          <Card>
            <CardHeader>
              <CardTitle>{ts("impact")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {impacts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {tc("impactPreview")}
                </p>
              )}
              {impacts.map((item) => (
                <div
                  key={item.factor}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{factorLabel(item.factor)}</span>
                  <span
                    className={
                      item.modifier > 0
                        ? "text-green-600 dark:text-green-400 font-medium"
                        : "text-red-600 dark:text-red-400 font-medium"
                    }
                  >
                    {item.modifier > 0 ? "+" : ""}
                    {item.modifier}
                  </span>
                </div>
              ))}
              {impacts.length > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between font-bold">
                    <span>{tc("total")}</span>
                    <span
                      className={
                        totalImpact >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {totalImpact > 0 ? "+" : ""}
                      {totalImpact.toFixed(1)} {ts("years")}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
