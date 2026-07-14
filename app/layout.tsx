import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GOOD MINT — CRM para corretores de imóveis",
  description:
    "Organize seus leads e imóveis e acompanhe o cliente até depois da venda. Pré-venda e pós-venda num só lugar. Teste grátis de 3 dias.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a2540",
};

// Lê o tema salvo antes da hidratação, pra não piscar claro→escuro ao carregar.
const THEME_INIT_SCRIPT = `
  try {
    var t = localStorage.getItem("gm-theme");
    if (t === "dark") document.documentElement.dataset.theme = "dark";
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-gm-50 text-gm-900 antialiased">{children}</body>
    </html>
  );
}
