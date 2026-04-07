import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Footer } from "@/components/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GitLife — Your Life as a GitHub Contribution Grid",
    template: "%s | GitLife",
  },
  description:
    "Your life is ~4,000 weeks. See them all in one grid. Green if you shipped code, gray if you didn't, empty — your future. Compare with Linus Torvalds, Karpathy, and 28 other famous devs.",
  keywords: [
    "life in weeks",
    "github contribution grid",
    "life visualization",
    "life expectancy calculator",
    "developer tools",
    "open source",
    "github activity",
    "life tracker",
  ],
  authors: [{ name: "GitLife", url: "https://gitlifeio.vercel.app" }],
  creator: "GitLife",
  metadataBase: new URL("https://gitlifeio.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gitlifeio.vercel.app",
    siteName: "GitLife",
    title: "GitLife — Your Life as a GitHub Contribution Grid",
    description:
      "Your life is ~4,000 weeks. One cell = one week. Green if you shipped code. See your entire life, compare with famous developers, and decide what to do with the time you have left.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitLife — Your Life as a GitHub Contribution Grid",
    description:
      "Your life is ~4,000 weeks. See them all. Compare with Torvalds, Karpathy, and 28 other legends.",
    creator: "@timoncool",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <TooltipProvider>
              {children}
              <Footer />
              <Toaster richColors position="bottom-right" />
              <ScrollToTop />
            </TooltipProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
