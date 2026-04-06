import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { locales, defaultLocale, type Locale } from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  let locale: Locale = defaultLocale;

  // 1. Check cookie override
  const cookieLocale = cookieStore.get("locale")?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } else {
    // 2. Parse Accept-Language header
    const acceptLanguage = headerStore.get("accept-language");
    if (acceptLanguage) {
      const preferred = acceptLanguage
        .split(",")
        .map((part) => {
          const [lang, q] = part.trim().split(";q=");
          return { lang: lang.trim().split("-")[0], q: q ? parseFloat(q) : 1 };
        })
        .sort((a, b) => b.q - a.q);

      for (const { lang } of preferred) {
        if (locales.includes(lang as Locale)) {
          locale = lang as Locale;
          break;
        }
      }
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
