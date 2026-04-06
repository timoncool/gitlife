export const locales = ["en", "zh", "es", "pt", "ru", "de", "ja"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
