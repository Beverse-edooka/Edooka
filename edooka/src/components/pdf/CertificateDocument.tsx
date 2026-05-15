import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

export type CertificatePdfProps = {
  recipientName: string;
  programTitle: string;
  certificateNumber: string;
  issuedDateLabel: string;
  verifyUrl: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    backgroundColor: "#fffbf7",
  },
  border: {
    borderWidth: 2,
    borderColor: "#ff6b35",
    borderRadius: 12,
    padding: 36,
    minHeight: "80%",
  },
  label: {
    fontSize: 11,
    letterSpacing: 2,
    color: "#ff6b35",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    textAlign: "center",
    marginBottom: 12,
    color: "#18181b",
  },
  subtitle: {
    fontSize: 11,
    textAlign: "center",
    color: "#71717a",
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    textAlign: "center",
    marginVertical: 16,
    color: "#18181b",
  },
  body: {
    fontSize: 12,
    textAlign: "center",
    color: "#3f3f46",
    lineHeight: 1.6,
    marginBottom: 8,
  },
  program: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "bold",
    color: "#18181b",
    marginTop: 8,
  },
  meta: {
    marginTop: 28,
    fontSize: 10,
    color: "#71717a",
    textAlign: "center",
  },
  qrWrap: {
    marginTop: 20,
    alignItems: "center",
  },
  qr: {
    width: 72,
    height: 72,
  },
  footer: {
    marginTop: 24,
    fontSize: 10,
    textAlign: "center",
    color: "#a1a1aa",
  },
});

function qrImageSrc(verifyUrl: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=144x144&data=${encodeURIComponent(verifyUrl)}`;
}

export function CertificateDocument({
  recipientName,
  programTitle,
  certificateNumber,
  issuedDateLabel,
  verifyUrl,
}: CertificatePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border}>
          <Text style={styles.label}>Certificate of achievement</Text>
          <Text style={styles.title}>edooka Skill Validation</Text>
          <Text style={styles.subtitle}>This certifies that</Text>
          <Text style={styles.name}>{recipientName}</Text>
          <Text style={styles.body}>has successfully completed the professional assessment for</Text>
          <Text style={styles.program}>{programTitle}</Text>
          <Text style={styles.meta}>Certificate ID · {certificateNumber}</Text>
          <Text style={styles.meta}>Issued on {issuedDateLabel}</Text>
          <View style={styles.qrWrap}>
            <Image style={styles.qr} src={qrImageSrc(verifyUrl)} />
          </View>
          <Text style={styles.footer}>Scan to verify · {verifyUrl}</Text>
          <Text style={styles.footer}>edooka.in</Text>
        </View>
      </Page>
    </Document>
  );
}
