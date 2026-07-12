// components/OnboardingWizard.tsx — 3 passos no primeiro acesso: emoji, foto,
// primeiro lead. Barra de progresso, pode pular em qualquer etapa.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmojiPicker } from "./EmojiPicker";
import { AvatarUpload } from "./AvatarUpload";
import { createLead, completeOnboarding } from "@/app/(dashboard)/actions";

const STEPS = ["Emoji", "Foto", "Primeiro lead"];

export function OnboardingWizard({
  fullName,
  initialEmoji,
  initialAvatarUrl,
}: {
  fullName: string;
  initialEmoji: string;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    try {
      await completeOnboarding();
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  async function onFinishStep3(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (leadName.trim()) {
        const fd = new FormData();
        fd.set("name", leadName.trim());
        fd.set("phone", leadPhone);
        await createLead(fd);
      }
      await finish();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-6 flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-gm-500" : "bg-gm-100"}`}
          />
        ))}
      </div>

      {step === 0 && (
        <div className="gm-card p-6 text-center">
          <h1 className="text-xl font-bold text-gm-900">Escolha seu emoji</h1>
          <p className="mt-1 text-sm text-gm-700/60">Ele aparece na saudação do seu Dashboard.</p>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="my-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gm-200 py-4 text-3xl"
          >
            <span className="gm-broker-emoji">{emoji}</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={finish}
              disabled={saving}
              className="min-h-11 flex-1 rounded-lg border border-gm-200 py-2.5 text-sm font-medium text-gm-700"
            >
              Pular
            </button>
            <button
              onClick={() => setStep(1)}
              className="min-h-11 flex-1 rounded-lg bg-gm-500 py-2.5 text-sm font-semibold text-white hover:bg-gm-600"
            >
              Continuar
            </button>
          </div>
          {pickerOpen && (
            <EmojiPicker onClose={() => setPickerOpen(false)} onSelect={setEmoji} />
          )}
        </div>
      )}

      {step === 1 && (
        <div className="gm-card p-6 text-center">
          <h1 className="text-xl font-bold text-gm-900">Coloque sua foto</h1>
          <p className="mt-1 text-sm text-gm-700/60">Aparece no menu lateral, ao lado do seu nome.</p>
          <div className="my-6 flex justify-center">
            <AvatarUpload fullName={fullName} initialUrl={initialAvatarUrl} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={finish}
              disabled={saving}
              className="min-h-11 flex-1 rounded-lg border border-gm-200 py-2.5 text-sm font-medium text-gm-700"
            >
              Pular
            </button>
            <button
              onClick={() => setStep(2)}
              className="min-h-11 flex-1 rounded-lg bg-gm-500 py-2.5 text-sm font-semibold text-white hover:bg-gm-600"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={onFinishStep3} className="gm-card p-6 text-center">
          <h1 className="text-xl font-bold text-gm-900">Cadastre seu primeiro lead</h1>
          <p className="mt-1 text-sm text-gm-700/60">Comece a preencher seu funil agora mesmo.</p>
          <div className="my-6 space-y-3 text-left">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gm-900">Nome</span>
              <input
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gm-900">Telefone (opcional)</span>
              <input
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={finish}
              disabled={saving}
              className="min-h-11 flex-1 rounded-lg border border-gm-200 py-2.5 text-sm font-medium text-gm-700"
            >
              Pular
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 flex-1 rounded-lg bg-gm-500 py-2.5 text-sm font-semibold text-white hover:bg-gm-600"
            >
              {saving ? "Salvando..." : "Concluir"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
