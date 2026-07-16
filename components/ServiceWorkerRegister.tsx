// components/ServiceWorkerRegister.tsx — registra o service worker (necessário
// tanto pra push notifications quanto pra "Adicionar à tela inicial" funcionar
// como app de verdade, com ícone e sem barra de navegador).
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
