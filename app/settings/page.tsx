"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { CalculatorForm } from "@/components/calculator-form";
import { useSession } from "@/lib/auth-client";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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
  const [useManual, setUseManual] = useState(false);
  const [manualAge, setManualAge] = useState(75);

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
              {t("loading")}
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
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
            {profile && (
              <div className="flex items-center gap-3">
                <span className="text-lg text-muted-foreground">
                  {t("estimatedAge")}:
                </span>
                <span className="text-3xl font-semibold text-primary font-mono tabular-nums">
                  {profile.expectedAge ?? 75} {t("years")}
                </span>
              </div>
            )}
          </div>

          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="calculator" className="flex-1">{t("calculator")}</TabsTrigger>
              <TabsTrigger value="manual" className="flex-1">{t("manualOverride")}</TabsTrigger>
            </TabsList>
            <TabsContent value="calculator">
              <CalculatorForm
                mode="full"
                initialValues={
                  profile?.calculatorAnswers ? profile.calculatorAnswers : undefined
                }
                initialBirthDate={profile?.birthDate ?? undefined}
                onSaved={fetchProfile}
              />
            </TabsContent>
            <TabsContent value="manual">
              <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-6">
                <Slider
                  min={50}
                  max={110}
                  step={1}
                  value={[manualAge]}
                  onValueChange={(val) => setManualAge(Array.isArray(val) ? val[0] ?? 75 : val)}
                />
                <div className="text-center text-3xl font-semibold text-primary font-mono tabular-nums">
                  {manualAge} {t("years")}
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/user", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ expectedAge: manualAge }),
                      });
                      if (res.ok) {
                        toast.success(t("saved"));
                        fetchProfile();
                      } else {
                        toast.error("Failed to save");
                      }
                    } catch {
                      toast.error("Failed to save");
                    }
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white"
                >
                  {t("save")}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
