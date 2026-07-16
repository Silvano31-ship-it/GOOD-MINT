// app/(dashboard)/configuracoes/page.tsx — Tela 6. Meu Perfil (hub de Configurações).
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { updateProfile } from "@/app/(dashboard)/actions";
import { PageHeader } from "@/components/ui";
import { AvatarUpload } from "@/components/AvatarUpload";
import { SubmitButton } from "@/components/SubmitButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";

const SECTIONS = [
  { href: "/configuracoes/plano", icon: "💳", title: "Plano e Cobrança", desc: "Assinatura, faturas e cancelamento" },
  { href: "/configuracoes/notificacoes", icon: "🔔", title: "Notificações", desc: "O que você recebe e onde" },
  { href: "/configuracoes/integracoes", icon: "🔌", title: "Integrações", desc: "WhatsApp, Instagram, Facebook, TikTok" },
  { href: "/configuracoes/bot", icon: "🤖", title: "Bot de IA", desc: "Tom de voz, horários, mensagens automáticas" },
  { href: "/configuracoes/pos-venda-etapas", icon: "🏷️", title: "Etapas do Pós-Venda", desc: "Renomeie as etapas do processo" },
  { href: "/configuracoes/fundo", icon: "🖼️", title: "Personalizar Fundo", desc: "Foto ou vídeo de fundo do Dashboard" },
];

export default async function ConfiguracoesPage() {
  const user = await requireActiveAccount();

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Gerencie seu perfil, plano e integrações." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="gm-card p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-gm-900">Meu perfil</h2>
          <div className="mb-5">
            <AvatarUpload fullName={user.full_name} initialUrl={user.avatar_url} />
          </div>
          <form action={updateProfile} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gm-900">Nome completo</span>
              <input name="full_name" defaultValue={user.full_name} required className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gm-900">E-mail</span>
              <input value={user.email} disabled className="w-full rounded-lg border border-gm-100 bg-gm-50 px-3 py-2 text-sm text-gm-700/60" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gm-900">Telefone / WhatsApp</span>
              <input name="phone" defaultValue={user.phone} className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gm-900">CRECI (opcional)</span>
              <input name="creci" defaultValue={user.creci ?? ""} className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gm-900">Sobre você (opcional)</span>
              <textarea
                name="bio"
                defaultValue={user.bio ?? ""}
                maxLength={400}
                rows={3}
                placeholder="Uma breve descrição sobre você como corretor."
                className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gm-900">Nome da empresa/imobiliária (opcional)</span>
              <input name="company_name" defaultValue={user.company_name ?? ""} className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gm-900">Sobre a empresa (opcional)</span>
              <textarea
                name="company_bio"
                defaultValue={user.company_bio ?? ""}
                maxLength={400}
                rows={3}
                placeholder="Uma breve descrição da sua empresa ou imobiliária."
                className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
              />
            </label>
            <SubmitButton>Salvar alterações</SubmitButton>
          </form>
        </div>

        <div className="space-y-3">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="gm-card flex items-center gap-3 p-4 transition hover:-translate-y-0.5">
              <span className="text-xl">{s.icon}</span>
              <div>
                <div className="text-sm font-semibold text-gm-900">{s.title}</div>
                <div className="text-xs text-gm-700/60">{s.desc}</div>
              </div>
            </Link>
          ))}

          <div className="gm-card space-y-1 p-3">
            <ThemeToggle className="w-full justify-start" />
            <LogoutButton
              label="↪ Sair"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gm-700 hover:bg-gm-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
