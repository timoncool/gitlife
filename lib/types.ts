// Life expectancy calculator types

export interface LifeExpectancyEntry {
  name: string;
  male: number;
  female: number;
}

export type LifeExpectancyData = Record<string, LifeExpectancyEntry>;

export interface CalculatorAnswers {
  country: string;
  sex: "male" | "female";
  birthDate: string;

  // Height in cm, weight in kg (for BMI)
  height: number;
  weight: number;

  smoking: "never" | "quit_before_35" | "quit_35_54" | "quit_55plus" | "current";
  alcohol: "none" | "moderate" | "heavy";
  activity: "sedentary" | "light" | "moderate" | "active";
  sleep: "lt6" | "6_7" | "7_8" | "9plus";
  diet: "poor" | "average" | "good" | "excellent";
  social: "isolated" | "some" | "strong";
  stress: "low" | "moderate" | "high" | "severe";
  education: "less_hs" | "hs" | "college" | "bachelor" | "graduate";
  maritalStatus: "married" | "cohabiting" | "divorced" | "widowed" | "single";
  hypertension: "normal" | "elevated" | "stage1" | "stage2" | "unknown";
  depression: "none" | "mild" | "moderate" | "severe";
  sittingHours: "lt4" | "4_6" | "7_9" | "10plus";
  optimism: "very" | "somewhat" | "neutral" | "pessimistic";
  purpose: "strong" | "moderate" | "uncertain" | "none";
  coffee: "0" | "1_2" | "3_4" | "5plus";
  airPollution: "clean" | "moderate" | "polluted" | "heavy";
  diabetes: "no" | "type2_under40" | "type2_40_50" | "type2_over50";

  familyLongevity: boolean;
  conditions: ("active_cancer" | "heart_disease" | "cancer_remission")[];
}

export interface LifeExpectancyResult {
  baseline: number;
  estimated: number;
  breakdown: { factor: string; modifier: number }[];
}

// Grid types

export type CellState =
  | "future"
  | "pre-github"
  | "no-commits"
  | "level-1"
  | "level-2"
  | "level-3"
  | "level-4"
  | "current";

export interface CellData {
  year: number;
  week: number;
  state: CellState;
  date: Date;
  commits?: number;
}

export interface GridStats {
  weeksLived: number;
  weeksTotal: number;
  percentLived: number;
  activeWeeks: number;
  currentStreak: number;
  longestStreak: number;
}

export interface YearContribution {
  date: string;
  count: number;
}
