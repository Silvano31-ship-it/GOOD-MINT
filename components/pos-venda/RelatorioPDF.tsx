// components/pos-venda/RelatorioPDF.tsx — documento @react-pdf/renderer do
// "Laudo de Pós-Venda". Só server-side (importado apenas pela rota de
// relatório) — não é uma página/componente React normal.
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { POST_SALE_STAGES, type PostSaleStage } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#0d7a4f" },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#555" },
  historyItem: { marginBottom: 4, paddingBottom: 4, borderBottom: "1px solid #eee" },
  checklistItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  confirmBox: { marginTop: 24, padding: 12, backgroundColor: "#f0f9f4", borderRadius: 4 },
});

export interface RelatorioPDFProps {
  leadName: string;
  propertyAddress: string | null;
  brokerName: string;
  currentStage: string;
  history: { to_stage: string; changed_at: string; note: string | null }[];
  checklist: { label: string; status: string }[];
  generatedAt: string;
  stages?: readonly PostSaleStage[];
}

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  enviado: "Enviado",
  validado: "Validado",
  rejeitado: "Rejeitado",
};

export function RelatorioPDF({
  leadName,
  propertyAddress,
  brokerName,
  currentStage,
  history,
  checklist,
  generatedAt,
  stages = POST_SALE_STAGES,
}: RelatorioPDFProps) {
  const stageLabel = (k: string) => stages.find((s) => s.key === k)?.label ?? k;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Laudo de Pós-Venda</Text>
        <Text style={styles.subtitle}>GOOD MINT · Gerado em {formatDateTime(generatedAt)}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          <View style={styles.row}><Text style={styles.label}>Cliente</Text><Text>{leadName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Imóvel</Text><Text>{propertyAddress ?? "—"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Corretor responsável</Text><Text>{brokerName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Etapa atual</Text><Text>{stageLabel(currentStage)}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de etapas</Text>
          {history.map((h, i) => (
            <View key={i} style={styles.historyItem}>
              <Text>{stageLabel(h.to_stage)} — {formatDateTime(h.changed_at)}</Text>
              {h.note && <Text style={{ color: "#777", fontSize: 9 }}>{h.note}</Text>}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checklist de documentos</Text>
          {checklist.length === 0 && <Text style={{ color: "#999" }}>Nenhum item registrado.</Text>}
          {checklist.map((c, i) => (
            <View key={i} style={styles.checklistItem}>
              <Text>{c.label}</Text>
              <Text>{STATUS_LABEL[c.status] ?? c.status}</Text>
            </View>
          ))}
        </View>

        <View style={styles.confirmBox}>
          <Text>Confirmado digitalmente por {brokerName} em {formatDateTime(generatedAt)}.</Text>
          <Text style={{ fontSize: 8, color: "#888", marginTop: 4 }}>
            Confirmação simbólica de conferência — não substitui assinatura eletrônica com validade jurídica.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
