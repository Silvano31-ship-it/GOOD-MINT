// components/relatorio/RelatorioPDF.tsx — documento @react-pdf/renderer do
// Relatório de métricas. Só server-side (importado apenas pela rota de
// exportação) — mesmo padrão de components/notas/NotePDF.tsx.
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatBRL, formatDateTime } from "@/lib/format";
import type { MonthlyCount, OriginCount, MonthlyCommission } from "@/lib/data";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#1e63c4" },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 8, marginTop: 16 },
  statsRow: { flexDirection: "row", marginBottom: 4 },
  statBox: { flex: 1, padding: 8, backgroundColor: "#f5f7fb", borderRadius: 4, marginRight: 8 },
  statLabel: { fontSize: 9, color: "#666" },
  statValue: { fontSize: 15, fontWeight: 700, color: "#0a2540", marginTop: 2 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e9f0", paddingVertical: 4 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#0a2540", paddingBottom: 4, marginBottom: 2 },
  cellLabel: { flex: 2, fontSize: 10 },
  cellValue: { flex: 1, fontSize: 10, textAlign: "right" },
  headerText: { fontSize: 9, fontWeight: 700, color: "#666" },
});

function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export interface RelatorioPDFProps {
  periodLabel: string;
  totalLeads: number;
  conversionRate: number;
  avgSaleDays: number;
  totalCommissionCents: number;
  leadsByMonth: MonthlyCount[];
  leadsByOrigin: OriginCount[];
  commissionByMonth: MonthlyCommission[];
  generatedAt: string;
}

export function RelatorioPDF({
  periodLabel,
  totalLeads,
  conversionRate,
  avgSaleDays,
  totalCommissionCents,
  leadsByMonth,
  leadsByOrigin,
  commissionByMonth,
  generatedAt,
}: RelatorioPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório | GOOD 🟢</Text>
        <Text style={styles.subtitle}>
          Período: {periodLabel} · Gerado em {formatDateTime(generatedAt)}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Novos leads</Text>
            <Text style={styles.statValue}>{totalLeads}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Taxa de conversão</Text>
            <Text style={styles.statValue}>{conversionRate}%</Text>
          </View>
          <View style={[styles.statBox, { marginRight: 0 }]}>
            <Text style={styles.statLabel}>Tempo médio de venda</Text>
            <Text style={styles.statValue}>{avgSaleDays > 0 ? `${avgSaleDays} dias` : "—"}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { marginRight: 0 }]}>
            <Text style={styles.statLabel}>Comissão total no período</Text>
            <Text style={styles.statValue}>{formatBRL(totalCommissionCents)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Leads por mês</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, { flex: 2 }]}>Mês</Text>
          <Text style={[styles.headerText, { flex: 1, textAlign: "right" }]}>Leads</Text>
        </View>
        {leadsByMonth.length === 0 ? (
          <Text style={{ fontSize: 10, color: "#888" }}>Nenhum lead cadastrado no período.</Text>
        ) : (
          leadsByMonth.map((m) => (
            <View key={m.month} style={styles.tableRow}>
              <Text style={styles.cellLabel}>{monthLabel(m.month)}</Text>
              <Text style={styles.cellValue}>{m.count}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Origem dos leads</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, { flex: 2 }]}>Origem</Text>
          <Text style={[styles.headerText, { flex: 1, textAlign: "right" }]}>Leads</Text>
        </View>
        {leadsByOrigin.length === 0 ? (
          <Text style={{ fontSize: 10, color: "#888" }}>Nenhum lead cadastrado no período.</Text>
        ) : (
          leadsByOrigin.map((o) => (
            <View key={o.origin} style={styles.tableRow}>
              <Text style={styles.cellLabel}>{o.origin}</Text>
              <Text style={styles.cellValue}>{o.count}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Comissão por mês</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, { flex: 2 }]}>Mês</Text>
          <Text style={[styles.headerText, { flex: 1, textAlign: "right" }]}>Comissão</Text>
        </View>
        {commissionByMonth.length === 0 ? (
          <Text style={{ fontSize: 10, color: "#888" }}>Nenhuma comissão registrada no período.</Text>
        ) : (
          commissionByMonth.map((c) => (
            <View key={c.month} style={styles.tableRow}>
              <Text style={styles.cellLabel}>{monthLabel(c.month)}</Text>
              <Text style={styles.cellValue}>{formatBRL(c.totalCents)}</Text>
            </View>
          ))
        )}
      </Page>
    </Document>
  );
}
