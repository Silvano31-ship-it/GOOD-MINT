// app/(dashboard)/imoveis/novo/page.tsx — Tela 11. Cadastro de Imóvel.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { PropertyForm } from "@/components/imoveis/PropertyForm";
import { createProperty } from "@/app/(dashboard)/actions";

export default async function NovoImovelPage() {
  await requireActiveAccount();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/imoveis" className="text-sm text-gm-500 hover:underline">← Voltar</Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold text-gm-900">Cadastrar imóvel</h1>
      <PropertyForm action={createProperty} submitLabel="Cadastrar" />
    </div>
  );
}
