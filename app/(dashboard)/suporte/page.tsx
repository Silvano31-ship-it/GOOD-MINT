// app/(dashboard)/suporte/page.tsx — Suporte via WhatsApp.
import { requireActiveAccount } from "@/lib/account-guard";
import { PageHeader } from "@/components/ui";
import { SupportForm } from "@/components/SupportForm";

export default async function SuportePage() {
  await requireActiveAccount();

  return (
    <div>
      <PageHeader title="Suporte" subtitle="Estamos aqui para ajudar." />
      <div className="gm-card max-w-2xl p-6">
        <p className="mb-5 text-sm text-gm-700/70">
          Nosso suporte responde em horário comercial. Escolha a categoria que
          mais se encaixa na sua situação — isso ajuda a gente a te atender
          mais rápido.
        </p>
        <SupportForm />
      </div>
    </div>
  );
}
