// components/UpgradeNotice.tsx — Modal/aviso de limite atingido (tela 20).
import Link from "next/link";

export function UpgradeNotice({ message }: { message: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-amber-800">
        <span className="text-lg">⚡</span>
        <span>{message} Os planos Pro e Business (com limites maiores) chegam em breve.</span>
      </div>
      <Link
        href="/configuracoes/plano"
        className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600"
      >
        Ver plano
      </Link>
    </div>
  );
}
