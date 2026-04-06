"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { CalculatorForm } from "@/components/calculator-form";
import { useSession } from "@/lib/auth-client";
import type { CalculatorAnswers } from "@/lib/types";

interface UserProfile {
  birthDate: string | null;
  expectedAge: number;
  calculatorAnswers: CalculatorAnswers | null;
  githubUsername: string;
  [key: string]: unknown;
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push("/");
    }
  }, [session, sessionLoading, router]);

  const fetchProfile = useCallback(() => {
    if (!session?.user) return;
    fetch("/api/user")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data: UserProfile | null) => {
        if (data) {
          setProfile(data);
        }
      })
      .finally(() => setLoading(false));
  }, [session?.user]);

  // Fetch profile
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (sessionLoading || loading) {
    return (
      <>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-muted-foreground animate-pulse text-lg">
              Loading...
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!session?.user) return null;

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-col gap-2 max-w-2xl mx-auto w-full">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          {profile && (
            <div className="flex items-center gap-3">
              <span className="text-lg text-muted-foreground">
                {t("estimatedAge")}:
              </span>
              <span className="text-3xl font-bold text-primary">
                {profile.expectedAge ?? 75} {t("years")}
              </span>
            </div>
          )}
        </div>

        <CalculatorForm
          mode="full"
          initialValues={
            profile?.calculatorAnswers ? profile.calculatorAnswers : undefined
          }
          initialBirthDate={profile?.birthDate ?? undefined}
          onSaved={fetchProfile}
        />
      </main>
    </>
  );
}
