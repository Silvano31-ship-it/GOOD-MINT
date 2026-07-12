// app/(dashboard)/onboarding/page.tsx — wizard de 3 passos no primeiro acesso.
import { redirect } from "next/navigation";
import { requireActiveAccount } from "@/lib/account-guard";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export default async function OnboardingPage() {
  const user = await requireActiveAccount();
  if (user.onboarding_done) redirect("/dashboard");

  return (
    <OnboardingWizard
      fullName={user.full_name}
      initialEmoji={user.dashboard_emoji}
      initialAvatarUrl={user.avatar_url}
    />
  );
}
