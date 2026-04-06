"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { CalculatorForm } from "@/components/calculator-form";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const [manualAge, setManualAge] = useState(80);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push("/");
    }
  }, [session, sessionLoading, router]);

  // Fetch profile
  useEffect(() => {
    if (!session?.user) return;

    fetch("/api/user")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data: UserProfile | null) => {
        if (data) {
          setProfile(data);
          setManualAge(data.expectedAge ?? 80);
        }
      })
      .finally(() => setLoading(false));
  }, [session?.user]);

  async function handleManualSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedAge: manualAge }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

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
        <div className="flex flex-col gap-2">
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

        <Tabs defaultValue="calculator">
          <TabsList>
            <TabsTrigger value="calculator">{t("tabCalculator")}</TabsTrigger>
            <TabsTrigger value="manual">{t("tabManual")}</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <div className="pt-6">
              <CalculatorForm
                initialValues={
                  profile?.calculatorAnswers
                    ? profile.calculatorAnswers
                    : undefined
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <div className="pt-6 max-w-lg">
              <Card>
                <CardHeader>
                  <CardTitle>{t("manualOverride")}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <p className="text-sm text-muted-foreground">
                    {t("manualDescription")}
                  </p>
                  <Slider
                    min={50}
                    max={110}
                    step={1}
                    value={[manualAge]}
                    onValueChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      setManualAge(v);
                    }}
                  />
                  <div className="text-center text-4xl font-bold">
                    {manualAge}{" "}
                    <span className="text-lg font-normal text-muted-foreground">
                      {t("years")}
                    </span>
                  </div>
                  <Button
                    onClick={handleManualSave}
                    disabled={saving}
                    size="lg"
                  >
                    {saved ? t("saved") : saving ? "..." : t("save")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
