"use client";

import { useTranslations } from "next-intl";
import { signIn } from "@/lib/auth-client";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function SignInButton({ size = "default" }: { size?: "default" | "lg" }) {
  const t = useTranslations("landing");

  const isLg = size === "lg";

  return (
    <button
      onClick={() => signIn.social({ provider: "github" })}
      className={`
        group relative inline-flex items-center justify-center gap-2.5
        rounded-xl font-semibold
        bg-[#24292f] text-white
        shadow-lg shadow-black/20
        transition-all duration-200
        hover:bg-[#1b1f23] hover:shadow-xl hover:shadow-black/30 hover:scale-[1.02]
        active:scale-[0.98]
        dark:bg-white dark:text-[#24292f] dark:hover:bg-gray-100
        dark:shadow-white/10 dark:hover:shadow-white/20
        ${isLg ? "h-13 px-8 text-base" : "h-11 px-6 text-sm"}
      `}
    >
      <GitHubIcon className={isLg ? "h-5.5 w-5.5" : "h-5 w-5"} />
      <span>{t("signIn")}</span>
      <svg
        className="h-4 w-4 opacity-50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:opacity-80"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </button>
  );
}
