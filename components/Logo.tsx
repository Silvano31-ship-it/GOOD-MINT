// components/Logo.tsx — marca GOOD MINT (folha de menta estilizada em azul).

export function Logo({
  size = 28,
  variant = "dark",
}: {
  size?: number;
  variant?: "dark" | "light" | "gold";
}) {
  if (variant === "gold") {
    return (
      <span className="relative inline-flex items-center gap-2 font-bold tracking-tight">
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
          <rect width="32" height="32" rx="9" fill="#1e63c4" />
          <path
            d="M16 6c-4.5 2-7 5-7 9.2C9 20 12 24 16 26c4-2 7-6 7-10.8C23 11 20.5 8 16 6z"
            fill="#fff"
          />
          <path d="M16 9v14" stroke="#1e63c4" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="relative inline-block">
          <span className="text-[#F5C94A]">GOOD</span> <span className="text-white">MINT</span>
          {/* Brilho varrendo por cima do texto — camada decorativa, texto real
              já está acima sempre visível (ver .gm-sidebar-logo-shine). */}
          <span
            aria-hidden
            className="gm-sidebar-logo-shine pointer-events-none absolute inset-0 bg-clip-text text-transparent"
          >
            GOOD MINT
          </span>
        </span>
      </span>
    );
  }

  const text = variant === "light" ? "text-white" : "text-gm-900";
  return (
    <span className="inline-flex items-center gap-2 font-bold tracking-tight">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#1e63c4" />
        <path
          d="M16 6c-4.5 2-7 5-7 9.2C9 20 12 24 16 26c4-2 7-6 7-10.8C23 11 20.5 8 16 6z"
          fill="#fff"
        />
        <path d="M16 9v14" stroke="#1e63c4" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className={text}>
        GOOD <span className="text-gm-500">MINT</span>
      </span>
    </span>
  );
}
