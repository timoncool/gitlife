/**
 * Fetches life expectancy data from the World Bank API and saves it as JSON.
 *
 * Usage: npx tsx scripts/fetch-life-expectancy.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

interface WBIndicatorResponse {
  page: number;
  pages: number;
  per_page: string;
  total: number;
}

interface WBIndicatorEntry {
  country: { id: string; value: string };
  value: number | null;
  date: string;
}

interface WBCountryEntry {
  id: string;
  iso2Code: string;
  name: string;
  region: { id: string; value: string };
  capitalCity: string;
}

type LifeExpectancyOutput = Record<
  string,
  { name: string; male: number; female: number }
>;

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

async function main() {
  console.log("Fetching country list...");
  const [, countries] = await fetchJSON<[WBIndicatorResponse, WBCountryEntry[]]>(
    "https://api.worldbank.org/v2/country?format=json&per_page=300"
  );

  // Filter out aggregates — real countries have region.id !== "NA"
  const realCountries = countries.filter((c) => c.region.id !== "NA");

  // Map iso2Code -> { iso3: id, name } for bridging indicator data (uses iso2) to output (uses iso3)
  const iso2ToCountry = new Map(
    realCountries.map((c) => [c.iso2Code, { iso3: c.id, name: c.name }])
  );

  console.log(`Found ${realCountries.length} countries (excluding aggregates)`);

  console.log("Fetching male life expectancy...");
  const [, maleData] = await fetchJSON<[WBIndicatorResponse, WBIndicatorEntry[]]>(
    "https://api.worldbank.org/v2/country/all/indicator/SP.DYN.LE00.MA.IN?format=json&per_page=300&date=2023"
  );

  console.log("Fetching female life expectancy...");
  const [, femaleData] = await fetchJSON<[WBIndicatorResponse, WBIndicatorEntry[]]>(
    "https://api.worldbank.org/v2/country/all/indicator/SP.DYN.LE00.FE.IN?format=json&per_page=300&date=2023"
  );

  // Indicator data uses iso2 country codes — map to iso3
  const maleMap = new Map<string, number>();
  for (const entry of maleData) {
    const country = iso2ToCountry.get(entry.country.id);
    if (entry.value !== null && country) {
      maleMap.set(country.iso3, Math.round(entry.value * 10) / 10);
    }
  }

  const femaleMap = new Map<string, number>();
  for (const entry of femaleData) {
    const country = iso2ToCountry.get(entry.country.id);
    if (entry.value !== null && country) {
      femaleMap.set(country.iso3, Math.round(entry.value * 10) / 10);
    }
  }

  // Merge — only include countries that have both male and female data
  const result: LifeExpectancyOutput = {};
  for (const c of realCountries) {
    const male = maleMap.get(c.id);
    const female = femaleMap.get(c.id);
    if (male !== undefined && female !== undefined) {
      result[c.id] = { name: c.name, male, female };
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(result).sort(([a], [b]) => a.localeCompare(b))
  );

  const outDir = join(process.cwd(), "public", "data");
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, "life-expectancy.json");
  writeFileSync(outPath, JSON.stringify(sorted, null, 2), "utf-8");

  const count = Object.keys(sorted).length;
  const size = Buffer.byteLength(JSON.stringify(sorted, null, 2), "utf-8");
  console.log(`Wrote ${outPath}`);
  console.log(`  ${count} countries, ${(size / 1024).toFixed(1)}KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
