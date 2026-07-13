// app/api/pos-venda/[id]/relatorio/route.tsx — GET
// Gera e transmite o PDF "Laudo de Pós-Venda". Rota (não Server Component),
// por isso a checagem de sessão é manual em vez de requireActiveAccount().
// Extensão .tsx porque o corpo usa JSX (<RelatorioPDF ... />) diretamente.
import { renderToStream } from "@react-pdf/renderer";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { RelatorioPDF } from "@/components/pos-venda/RelatorioPDF";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return new Response("Não autenticado.", { status: 401 });

  const { rows } = await db.query<{
    lead_name: string;
    property_address: string | null;
    current_stage: string;
    broker_name: string;
  }>(
    `SELECT l.name AS lead_name, p.address AS property_address, ps.current_stage, u.full_name AS broker_name
     FROM post_sale_processes ps
     JOIN negotiations n ON n.id = ps.negotiation_id
     JOIN leads l ON l.id = n.lead_id
     LEFT JOIN properties p ON p.id = n.property_id
     JOIN users u ON u.id = ps.user_id
     WHERE ps.id = $1 AND ps.user_id = $2`,
    [params.id, session.userId]
  );
  const ps = rows[0];
  if (!ps) return new Response("Processo não encontrado.", { status: 404 });

  const { rows: history } = await db.query(
    `SELECT to_stage, changed_at, note FROM post_sale_stage_history WHERE post_sale_id=$1 ORDER BY changed_at ASC`,
    [params.id]
  );
  const { rows: checklist } = await db.query(
    `SELECT label, status FROM post_sale_checklist_items WHERE post_sale_id=$1 ORDER BY created_at ASC`,
    [params.id]
  );

  const stream = await renderToStream(
    <RelatorioPDF
      leadName={ps.lead_name}
      propertyAddress={ps.property_address}
      brokerName={ps.broker_name}
      currentStage={ps.current_stage}
      history={history as any}
      checklist={checklist as any}
      generatedAt={new Date().toISOString()}
    />
  );

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="laudo-pos-venda-${params.id}.pdf"`,
    },
  });
}
