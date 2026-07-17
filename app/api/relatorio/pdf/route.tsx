// app/api/relatorio/pdf/route.tsx — GET
// Exporta o Relatório de métricas em PDF pro período pedido (?dias=7|30|90|365).
// Mesmo padrão de app/api/notas/[id]/pdf/route.tsx.
import { renderToStream } from "@react-pdf/renderer";
import { getSession } from "@/lib/session";
import {
  getLeadsByMonth,
  getLeadsByOrigin,
  getCommissionByMonth,
  getConversionRateForPeriod,
  getAvgSaleDays,
} from "@/lib/data";
import { RelatorioPDF } from "@/components/relatorio/RelatorioPDF";

const PERIOD_LABELS: Record<string, string> = {
  "7": "últimos 7 dias",
  "30": "últimos 30 dias",
  "90": "últimos 90 dias",
  "365": "último ano",
};

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Não autenticado.", { status: 401 });

  const url = new URL(req.url);
  const dias = url.searchParams.get("dias") ?? "30";
  const days = PERIOD_LABELS[dias] ? Number(dias) : 30;
  const sinceDate = new Date(Date.now() - days * 86400000);

  const [leadsByMonth, leadsByOrigin, commissionByMonth, conversionRate, avgSaleDays] = await Promise.all([
    getLeadsByMonth(session.userId, sinceDate),
    getLeadsByOrigin(session.userId, sinceDate),
    getCommissionByMonth(session.userId, sinceDate),
    getConversionRateForPeriod(session.userId, sinceDate),
    getAvgSaleDays(session.userId, sinceDate),
  ]);

  const totalLeads = leadsByMonth.reduce((sum, m) => sum + m.count, 0);
  const totalCommissionCents = commissionByMonth.reduce((sum, m) => sum + m.totalCents, 0);

  const stream = await renderToStream(
    <RelatorioPDF
      periodLabel={PERIOD_LABELS[dias] ?? "últimos 30 dias"}
      totalLeads={totalLeads}
      conversionRate={conversionRate}
      avgSaleDays={avgSaleDays}
      totalCommissionCents={totalCommissionCents}
      leadsByMonth={leadsByMonth}
      leadsByOrigin={leadsByOrigin}
      commissionByMonth={commissionByMonth}
      generatedAt={new Date().toISOString()}
    />
  );

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-good-mint.pdf"`,
    },
  });
}
