// components/notas/NotePDF.tsx — documento @react-pdf/renderer da nota.
// Só server-side (importado apenas pela rota de exportação), mesmo padrão do
// RelatorioPDF.tsx do pós-venda.
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { formatDateTime } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#0d7a4f" },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 16 },
  content: { marginBottom: 16, lineHeight: 1.5 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 8 },
  photo: { width: 220, marginBottom: 10, borderRadius: 4 },
  videoLine: { marginBottom: 4, color: "#555" },
});

export interface NotePDFProps {
  title: string;
  content: string | null;
  photos: string[];
  videoCount: number;
  generatedAt: string;
}

export function NotePDF({ title, content, photos, videoCount, generatedAt }: NotePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>GOOD MINT · Gerado em {formatDateTime(generatedAt)}</Text>

        {content && <Text style={styles.content}>{content}</Text>}

        {photos.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Fotos anexadas</Text>
            {photos.map((url, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={url} style={styles.photo} />
            ))}
          </View>
        )}

        {videoCount > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Vídeos anexados</Text>
            <Text style={styles.videoLine}>
              {videoCount} vídeo{videoCount > 1 ? "s" : ""} anexado{videoCount > 1 ? "s" : ""} —{" "}
              {videoCount > 1 ? "disponíveis" : "disponível"} na nota dentro do GOOD MINT (PDF não reproduz vídeo).
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
