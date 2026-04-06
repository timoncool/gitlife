import type { CalculatorAnswers, LifeExpectancyResult } from "@/lib/types";
import lifeExpectancyData from "@/public/data/life-expectancy.json";

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

function calculateBMI(height: number, weight: number): number {
  const heightM = height / 100;
  return weight / (heightM * heightM);
}

function getBMIModifier(bmi: number): number {
  if (bmi < 18.5) return -4;
  if (bmi < 25) return 0;
  if (bmi < 30) return -1;
  if (bmi < 35) return -3;
  return -8;
}

const data = lifeExpectancyData as Record<string, { name: string; male: number; female: number }>;

export function calculateLifeExpectancy(
  answers: CalculatorAnswers,
): LifeExpectancyResult {
  // Get baseline from country data
  const countryData = data[answers.country];
  const baseline = countryData
    ? countryData[answers.sex]
    : answers.sex === "male"
      ? 73
      : 79; // world average fallback

  const breakdown: { factor: string; modifier: number }[] = [];

  // Apply standard modifiers
  for (const [factor, options] of Object.entries(MODIFIERS)) {
    const value = answers[factor as keyof CalculatorAnswers] as string;
    const modifier = options[value];
    if (modifier !== undefined && modifier !== 0) {
      breakdown.push({ factor, modifier });
    }
  }

  // BMI
  const bmi = calculateBMI(answers.height, answers.weight);
  const bmiModifier = getBMIModifier(bmi);
  if (bmiModifier !== 0) {
    breakdown.push({ factor: "bmi", modifier: bmiModifier });
  }

  // Family longevity
  if (answers.familyLongevity) {
    breakdown.push({ factor: "familyLongevity", modifier: 2.5 });
  }

  // Conditions — additive, but active_cancer dominates if present
  if (answers.conditions.length > 0) {
    let conditionModifier: number;
    if (answers.conditions.includes("active_cancer")) {
      conditionModifier = CONDITION_MODIFIERS["active_cancer"];
    } else {
      conditionModifier = answers.conditions.reduce(
        (sum, c) => sum + (CONDITION_MODIFIERS[c] ?? 0),
        0,
      );
    }
    if (conditionModifier !== 0) {
      breakdown.push({ factor: "conditions", modifier: conditionModifier });
    }
  }

  // Calculate total modifier, capped at +/-25
  const totalModifier = breakdown.reduce((sum, b) => sum + b.modifier, 0);
  const cappedModifier = Math.max(-25, Math.min(25, totalModifier));
  const estimated = Math.round((baseline + cappedModifier) * 10) / 10;

  return { baseline, estimated, breakdown };
}
