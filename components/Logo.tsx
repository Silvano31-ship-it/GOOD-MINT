// components/Logo.tsx — marca GOOD MINT (folha de menta estilizada em azul).

export function Logo({
  size = 28,
  variant = "dark",
}: {
  size?: number;
  variant?: "dark" | "light";
}) {
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
