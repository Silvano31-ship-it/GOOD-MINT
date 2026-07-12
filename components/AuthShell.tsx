// components/AuthShell.tsx — layout das telas de autenticação (split azul/branco).
import Link from "next/link";
import { Logo } from "./Logo";
import { FloatingEmojis } from "./FloatingEmojis";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  animated = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Ativa emojis flutuantes no painel visual (tela de Cadastro). */
  animated?: boolean;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Lado visual */}
      <div className={`gm-radial relative hidden flex-col justify-between overflow-hidden p-10 text-white md:flex ${animated ? "gm-radial-animated" : ""}`}>
        {animated && <FloatingEmojis />}
        <Link href="/" className="relative z-10">
          <Logo variant="light" size={30} />
        </Link>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-snug">
            Pré-venda e pós-venda,
            <br /> num só lugar.
          </h2>
          <p className="mt-3 max-w-sm text-white/70">
            Capte leads, feche negócios e mantenha o cliente informado até a
            entrega das chaves.
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/50">© {new Date().getFullYear()} GOOD MINT</p>
      </div>

      {/* Lado formulário */}
      <div className="flex items-center justify-center bg-white px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gm-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gm-700/60">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-sm text-gm-700/70">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gm-900">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-gm-200 px-3 py-2.5 text-sm outline-none transition focus:border-gm-500 focus:ring-2 focus:ring-gm-100"
      />
    </label>
  );
}
