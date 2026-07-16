import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "GOOD MINT — CRM para corretores de imóveis",
  description:
    "Organize seus leads e imóveis e acompanhe o cliente até depois da venda. Pré-venda e pós-venda num só lugar. Teste grátis de 3 dias.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GOOD MINT",
  },
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a2540",
};

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
      <body className="min-h-screen bg-gm-50 text-gm-900 antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
