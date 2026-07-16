// components/imoveis/PropertyForm.tsx — formulário de imóvel (cadastro/edição, tela 11).
import Link from "next/link";
import type { Property } from "@/lib/data";
import { PRICE_ALIGNMENT_OPTIONS } from "@/lib/constants";

const TYPES = [
  ["apartamento", "Apartamento"],
  ["casa", "Casa"],
  ["terreno", "Terreno"],
  ["comercial", "Comercial"],
  ["rural", "Rural"],
  ["outro", "Outro"],
];

const STATUSES = [
  ["disponivel", "Disponível"],
  ["reservado", "Reservado"],
  ["vendido", "Vendido"],
  ["alugado", "Alugado"],
  ["inativo", "Inativo"],
];

export function PropertyForm({
  action,
  property,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  property?: Property;
  submitLabel: string;
}) {
  const price = property ? (Number(property.price_cents) / 100).toString() : "";
  return (
    <form action={action} className="gm-card space-y-4 p-6">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gm-900">Endereço *</span>
        <input name="address" required defaultValue={property?.address ?? ""} className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gm-900">Tipo</span>
          <select name="property_type" defaultValue={property?.property_type ?? "apartamento"} className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gm-900">Status</span>
          <select name="status" defaultValue={property?.status ?? "disponivel"} className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gm-900">Valor (R$)</span>
          <input name="price" inputMode="decimal" defaultValue={price} placeholder="Ex.: 350000" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gm-900">Metragem (m²)</span>
          <input name="area_m2" inputMode="decimal" defaultValue={property?.area_m2 ?? ""} placeholder="Ex.: 72" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gm-900">Descrição</span>
        <textarea name="description" rows={4} defaultValue={property?.description ?? ""} className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gm-900">Exclusividade</span>
          <select name="is_exclusive" defaultValue={property ? String(property.is_exclusive) : "true"} className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
            <option value="true">Exclusivo (só você anuncia)</option>
            <option value="false">Compartilhado (outros corretores também anunciam)</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gm-900">Alinhamento de preço</span>
          <select name="price_alignment" defaultValue={property?.price_alignment ?? ""} className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
            <option value="">Não avaliado</option>
            {PRICE_ALIGNMENT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </label>
      </div>

      <p className="text-xs text-gm-700/50">
        📷 O upload de fotos entra na próxima etapa (armazenamento de arquivos). Por
        ora, cadastre os dados principais do imóvel.
      </p>

      <div className="flex justify-end gap-2">
        <Link href="/imoveis" className="rounded-lg px-4 py-2 text-sm font-medium text-gm-700 hover:bg-gm-50">Cancelar</Link>
        <button className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">{submitLabel}</button>
      </div>
    </form>
  );
}
