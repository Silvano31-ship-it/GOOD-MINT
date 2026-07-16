// components/PushSetup.tsx — botão "Ativar notificações" (Web Push) e
// instruções de "Adicionar à tela inicial". No iPhone, o Safari só aceita
// push depois do app estar na tela inicial (limitação do próprio iOS, não
// dá pra contornar) — por isso a mensagem condicional abaixo.
"use client";

import { useEffect, useState } from "react";
import { savePushSubscription, removePushSubscription } from "@/app/(dashboard)/configuracoes/notificacoes/actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function PushSetup({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const [status, setStatus] = useState<"idle" | "loading" | "on" | "unsupported" | "denied">("idle");
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true
    );

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (sub) setStatus("on");
    });
  }, []);

  async function activate() {
    if (!vapidPublicKey) return;
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
      });
      await savePushSubscription(sub.toJSON() as any);
      setStatus("on");
    } catch (err) {
      console.error(err);
      setStatus("idle");
    }
  }

  async function deactivate() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await removePushSubscription(sub.endpoint);
      await sub.unsubscribe();
    }
    setStatus("idle");
  }

  const iosBlocked = isIOS && !isStandalone;

  return (
    <div className="gm-card space-y-4 p-4">
      <div>
        <h3 className="font-semibold text-gm-900">🔔 Notificações no celular</h3>
        <p className="mt-1 text-sm text-gm-700/70">
          Receba um aviso no celular, mesmo com o app fechado, quando surgir um lead novo, uma tarefa vencer ou um cliente ficar parado no pós-venda.
        </p>
      </div>

      {iosBlocked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          No iPhone, primeiro adicione o GOOD MINT à tela inicial (veja abaixo). Depois de adicionar, abra o app por esse ícone novo e volte aqui pra ativar as notificações.
        </div>
      )}

      {status === "unsupported" && (
        <p className="text-sm text-gm-700/50">Esse navegador não aceita notificações push.</p>
      )}
      {status === "denied" && (
        <p className="text-sm text-red-600">
          Notificações bloqueadas. Ative manualmente em Ajustes do celular → Notificações → GOOD MINT.
        </p>
      )}
      {(status === "idle" || status === "loading") && !iosBlocked && (
        <button
          onClick={activate}
          disabled={status === "loading"}
          className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60"
        >
          {status === "loading" ? "Ativando..." : "🔔 Ativar notificações"}
        </button>
      )}
      {status === "on" && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-green-700">✅ Notificações ativadas neste dispositivo</span>
          <button onClick={deactivate} className="text-xs text-gm-700/50 hover:underline">
            Desativar
          </button>
        </div>
      )}

      <div className="border-t border-gm-100 pt-4">
        <h4 className="text-sm font-semibold text-gm-900">📲 Adicionar à tela inicial</h4>
        {isIOS ? (
          <p className="mt-1 text-sm text-gm-700/70">
            Toque no ícone de compartilhar (□ com uma seta pra cima) na barra do Safari e escolha{" "}
            <b>"Adicionar à Tela de Início"</b>.
          </p>
        ) : (
          <p className="mt-1 text-sm text-gm-700/70">
            No menu do navegador (⋮), toque em <b>"Adicionar à tela inicial"</b> ou <b>"Instalar app"</b>.
          </p>
        )}
      </div>
    </div>
  );
}
