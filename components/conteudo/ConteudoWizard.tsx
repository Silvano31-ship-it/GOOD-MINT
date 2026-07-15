// components/conteudo/ConteudoWizard.tsx — assistente de 7 passos do Módulo
// Conteúdo com IA, tudo num único componente client (sem trocar de página a
// cada passo).
"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AI_CONTENT_TYPES,
  AI_CONTENT_TONES,
  AI_CONTENT_POSTING_TIPS,
  IMAGE_STYLES,
  type Property,
  type ImageStyleKey,
} from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import { generateCaptionsAction, generateImageAction, saveAiContent } from "@/app/(dashboard)/conteudo/actions";

const TOTAL_STEPS = 7;

export function ConteudoWizard({
  properties,
  initialPropertyId,
}: {
  properties: Property[];
  initialPropertyId: string | null;
}) {
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState<string>("imovel_disponivel");
  const [propertyId, setPropertyId] = useState<string | null>(initialPropertyId);
  const [subject, setSubject] = useState("");
  const [tone, setTone] = useState<string>("profissional");
  const [captions, setCaptions] = useState<string[] | null>(null);
  const [chosenCaption, setChosenCaption] = useState("");
  const [imageStyle, setImageStyle] = useState<ImageStyleKey>("fotorrealista");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isImovelType = contentType.startsWith("imovel_");
  const property = useMemo(() => properties.find((p) => p.id === propertyId) ?? null, [properties, propertyId]);
  const postTip = AI_CONTENT_POSTING_TIPS[contentType] ?? AI_CONTENT_POSTING_TIPS.personalizado;

  function next() {
    setError(null);
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function propertyForAi() {
    if (!property) return undefined;
    return {
      address: property.address,
      propertyType: property.property_type,
      priceCents: Number(property.price_cents),
      areaM2: property.area_m2 ? Number(property.area_m2) : null,
      description: property.description,
    };
  }

  function handleGenerateCaptions() {
    setError(null);
    startTransition(async () => {
      const res = await generateCaptionsAction({
        contentType,
        tone: tone as "profissional" | "amigavel" | "direto",
        property: isImovelType ? propertyForAi() : undefined,
        subject: isImovelType ? undefined : subject,
      });
      if (!res.ok) {
        setError(res.error ?? "Não foi possível gerar o texto.");
        return;
      }
      setCaptions(res.captions ?? []);
      setChosenCaption(res.captions?.[0] ?? "");
    });
  }

  function handleGenerateImage() {
    setError(null);
    startTransition(async () => {
      const res = await generateImageAction({
        property: isImovelType && property ? { address: property.address, propertyType: property.property_type, description: property.description } : undefined,
        subject: isImovelType ? undefined : subject,
        style: imageStyle,
      });
      if (!res.ok) {
        setError(res.error ?? "Não foi possível gerar a imagem.");
        return;
      }
      setImageUrl(res.url ?? null);
      setImagePrompt(res.prompt ?? null);
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveAiContent({
        propertyId: isImovelType ? propertyId : null,
        contentType,
        title: property?.address ?? subject.slice(0, 60) ?? null,
        content: chosenCaption,
        tone,
        imageUrl,
        imagePrompt,
        imageStyle: imageUrl ? imageStyle : null,
        postTip,
      });
      setSavedId(res.id);
    });
  }

  if (savedId) {
    return (
      <div className="gm-card mx-auto max-w-xl p-8 text-center">
        <div className="text-3xl">✅</div>
        <h2 className="mt-2 text-lg font-semibold text-gm-900">Conteúdo salvo!</h2>
        <p className="mt-1 text-sm text-gm-700/60">Você pode usá-lo agora numa publicação ou encontrá-lo depois na galeria.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href={`/social/nova?fromContentId=${savedId}`} className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
            Usar em publicação
          </Link>
          <Link href="/conteudo" className="rounded-lg border border-gm-200 px-4 py-2 text-sm font-medium text-gm-700 hover:bg-gm-50">
            Ver galeria
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="gm-card mx-auto max-w-2xl p-6">
      <div className="mb-5 text-xs font-medium text-gm-700/50">Passo {step} de {TOTAL_STEPS}</div>

      {step === 1 && (
        <div>
          <h2 className="mb-3 font-semibold text-gm-900">Que tipo de conteúdo você quer criar?</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {AI_CONTENT_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setContentType(t.key)}
                className={`rounded-lg border p-3 text-left text-sm font-medium transition ${
                  contentType === t.key ? "border-gm-500 bg-gm-50 text-gm-900" : "border-gm-200 text-gm-700 hover:bg-gm-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="mb-3 font-semibold text-gm-900">{isImovelType ? "Qual imóvel?" : "Sobre o que é o post?"}</h2>
          {isImovelType ? (
            properties.length === 0 ? (
              <p className="text-sm text-gm-700/60">Você ainda não tem imóveis cadastrados. Cadastre um em Imóveis ou escolha outro tipo de conteúdo.</p>
            ) : (
              <select
                value={propertyId ?? ""}
                onChange={(e) => setPropertyId(e.target.value || null)}
                className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500"
              >
                <option value="">Selecione um imóvel...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.address} — {formatBRL(Number(p.price_cents))}</option>
                ))}
              </select>
            )
          ) : (
            <textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              rows={4}
              placeholder="Ex.: 3 dicas para quem vai financiar o primeiro imóvel"
              className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500"
            />
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="mb-3 font-semibold text-gm-900">Qual tom você prefere?</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {AI_CONTENT_TONES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTone(t.key)}
                className={`rounded-lg border p-3 text-sm font-medium transition ${
                  tone === t.key ? "border-gm-500 bg-gm-50 text-gm-900" : "border-gm-200 text-gm-700 hover:bg-gm-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="mb-3 font-semibold text-gm-900">Texto da publicação</h2>
          {!captions ? (
            <button
              onClick={handleGenerateCaptions}
              disabled={pending}
              className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60"
            >
              {pending ? "Gerando..." : "✨ Gerar legendas"}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-2">
                {captions.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setChosenCaption(c)}
                    className={`rounded-lg border p-3 text-left text-sm transition ${
                      chosenCaption === c ? "border-gm-500 bg-gm-50" : "border-gm-200 hover:bg-gm-50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <textarea
                value={chosenCaption}
                onChange={(e) => setChosenCaption(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500"
              />
              <button
                onClick={handleGenerateCaptions}
                disabled={pending}
                className="rounded-lg border border-gm-200 px-3 py-1.5 text-xs font-medium text-gm-700 hover:bg-gm-50 disabled:opacity-60"
              >
                {pending ? "Gerando..." : "🔄 Gerar novamente"}
              </button>
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div>
          <h2 className="mb-1 font-semibold text-gm-900">Imagem (opcional)</h2>
          <p className="mb-3 text-sm text-gm-700/60">Escolha um estilo e gere uma imagem, ou pule esta etapa.</p>
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            {IMAGE_STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => setImageStyle(s.key)}
                className={`rounded-lg border p-3 text-left text-sm font-medium transition ${
                  imageStyle === s.key ? "border-gm-500 bg-gm-50 text-gm-900" : "border-gm-200 text-gm-700 hover:bg-gm-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="mb-3 w-full rounded-lg" />
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGenerateImage}
              disabled={pending}
              className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60"
            >
              {pending ? "Gerando..." : imageUrl ? "🔄 Gerar novamente" : "🖼️ Gerar imagem"}
            </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div>
          <h2 className="mb-3 font-semibold text-gm-900">Sugestão de postagem</h2>
          <div className="rounded-lg border border-gm-200 bg-gm-50 p-4 text-sm text-gm-700">{postTip}</div>
        </div>
      )}

      {step === 7 && (
        <div>
          <h2 className="mb-3 font-semibold text-gm-900">Revisar e salvar</h2>
          <div className="space-y-3 text-sm">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="w-full rounded-lg" />
            )}
            <p className="whitespace-pre-wrap rounded-lg border border-gm-200 p-3 text-gm-900">{chosenCaption || "(sem texto)"}</p>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex justify-between">
        <button
          onClick={back}
          disabled={step === 1}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gm-700 hover:bg-gm-50 disabled:opacity-0"
        >
          ← Voltar
        </button>
        {step < TOTAL_STEPS ? (
          <button
            onClick={next}
            disabled={(step === 2 && isImovelType && !propertyId) || (step === 4 && !chosenCaption.trim())}
            className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60"
          >
            {step === 5 ? "Pular / Continuar →" : "Continuar →"}
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={pending || !chosenCaption.trim()}
            className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60"
          >
            {pending ? "Salvando..." : "💾 Salvar"}
          </button>
        )}
      </div>
    </div>
  );
}
