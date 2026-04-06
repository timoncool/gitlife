"use client";

import { useRouter } from "next/navigation";
import { CalculatorForm } from "@/components/calculator-form";

export function OnboardingForm() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <CalculatorForm
        mode="wizard"
        onComplete={() => router.push("/dashboard")}
      />
    </div>
  );
}
