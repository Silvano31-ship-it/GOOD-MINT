// components/LogoutButton.tsx — botão "Sair" (item do menu / telas de conta).
"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ className, label = "Sair" }: { className?: string; label?: string }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className={className}>
      {label}
    </button>
  );
}
