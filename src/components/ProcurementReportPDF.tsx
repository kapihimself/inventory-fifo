import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: "Helvetica", fontSize: 9 },
  header: { marginBottom: 20, borderBottom: "2px solid #ff6b00", paddingBottom: 8 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  logoContainer: { flexDirection: "row", alignItems: "center" },
  logoCircle: { width: 12, height: 12, backgroundColor: "#ff6b00", borderRadius: 6, marginRight: 5 },
  bankText: { fontSize: 16, fontWeight: "bold" },
  bankOrange: { color: "#ff6b00" },
  bankBlue: { color: "#003366" },
  tagline: { fontSize: 8, color: "#003366", fontStyle: "italic" },
  title: { fontSize: 13, fontWeight: "bold", textAlign: "center", marginBottom: 10, marginTop: 10, textDecoration: "underline" },
  infoRow: { fontSize: 9, marginBottom: 3 },
  table: { display: "flex", width: "100%", borderStyle: "solid", borderWidth: 1, borderColor: "#333", marginTop: 10 },
  tableRowHeader: { flexDirection: "row", backgroundColor: "#f0f0f0", borderBottomWidth: 1, borderColor: "#333", minHeight: 22, alignItems: "center" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#ccc", minHeight: 20, alignItems: "center" },
  tableRowAlt: { backgroundColor: "#fafafa" },
  tableFooter: { flexDirection: "row", backgroundColor: "#dbeafe", borderTopWidth: 2, borderColor: "#3b82f6", minHeight: 22, alignItems: "center" },
  colNo:    { width: "5%",  padding: 4, textAlign: "center", borderRightWidth: 1, borderColor: "#ccc" },
  colDate:  { width: "10%", padding: 4, borderRightWidth: 1, borderColor: "#ccc" },
  colNama:  { width: "28%", padding: 4, borderRightWidth: 1, borderColor: "#ccc" },
  colCat:   { width: "12%", padding: 4, borderRightWidth: 1, borderColor: "#ccc", textAlign: "center" },
  colSat:   { width: "8%",  padding: 4, borderRightWidth: 1, borderColor: "#ccc", textAlign: "center" },
  colQty:   { width: "9%",  padding: 4, borderRightWidth: 1, borderColor: "#ccc", textAlign: "right" },
  colHarga: { width: "14%", padding: 4, borderRightWidth: 1, borderColor: "#ccc", textAlign: "right" },
  colJml:   { width: "14%", padding: 4, textAlign: "right" },
  bold: { fontWeight: "bold" },
  footer: { position: "absolute", bottom: 30, left: 50, right: 50, textAlign: "center", fontSize: 7, color: "#aaa" },
  signatureSection: { marginTop: 40, flexDirection: "row", justifyContent: "space-between" },
  signatureBox: { width: "40%", textAlign: "center" },
  signatureLabel: { fontSize: 9, marginBottom: 50 },
  signatureLine: { fontSize: 9, fontWeight: "bold", textDecoration: "underline" },
});

type ProcurementRow = {
  no: number; tgl: string; nama: string; category: string;
  unit: string; qty: number; price: number; total: number;
};

const formatRp = (v: number) =>
  "Rp " + v.toLocaleString("id-ID", { minimumFractionDigits: 0 });

export const ProcurementReportPDF = ({ data }: { data: ProcurementRow[] }) => {
  const grandTotal = data.reduce((s, r) => s + r.total, 0);
  const grandQty   = data.reduce((s, r) => s + r.qty, 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle} />
              <Text style={styles.bankText}>
                <Text style={styles.bankOrange}>Bank</Text>
                <Text style={styles.bankBlue}> SUMUT</Text>
              </Text>
            </View>
            <Text style={{ fontSize: 8, color: "#666" }}>
              {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
            </Text>
          </View>
          <Text style={styles.tagline}>PT Bank Pembangunan Daerah Sumatera Utara</Text>
        </View>

        <Text style={styles.title}>LAPORAN PENGADAAN BARANG INVENTORI (ATK)</Text>
        <Text style={styles.infoRow}>Tanggal Cetak : {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</Text>
        <Text style={styles.infoRow}>Total Data    : {data.length} transaksi penerimaan barang</Text>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <View style={styles.colNo}><Text style={styles.bold}>No</Text></View>
            <View style={styles.colDate}><Text style={styles.bold}>Tanggal</Text></View>
            <View style={styles.colNama}><Text style={styles.bold}>Nama Barang</Text></View>
            <View style={styles.colCat}><Text style={styles.bold}>Kategori</Text></View>
            <View style={styles.colSat}><Text style={styles.bold}>Satuan</Text></View>
            <View style={styles.colQty}><Text style={styles.bold}>Qty</Text></View>
            <View style={styles.colHarga}><Text style={styles.bold}>Harga Satuan</Text></View>
            <View style={styles.colJml}><Text style={styles.bold}>Jumlah</Text></View>
          </View>

          {data.map((r, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <View style={styles.colNo}><Text>{r.no}</Text></View>
              <View style={styles.colDate}><Text>{r.tgl}</Text></View>
              <View style={styles.colNama}><Text>{r.nama}</Text></View>
              <View style={styles.colCat}><Text>{r.category}</Text></View>
              <View style={styles.colSat}><Text>{r.unit}</Text></View>
              <View style={styles.colQty}><Text style={styles.bold}>{r.qty.toLocaleString("id-ID")}</Text></View>
              <View style={styles.colHarga}><Text>{r.price > 0 ? formatRp(r.price) : "-"}</Text></View>
              <View style={styles.colJml}><Text style={styles.bold}>{r.total > 0 ? formatRp(r.total) : "-"}</Text></View>
            </View>
          ))}

          {/* Footer row */}
          <View style={styles.tableFooter}>
            <View style={{ ...styles.colNo, width: "55%" }}>
              <Text style={[styles.bold, { textAlign: "right", paddingRight: 8 }]}>TOTAL NILAI PENGADAAN</Text>
            </View>
            <View style={styles.colQty}><Text style={styles.bold}>{grandQty.toLocaleString("id-ID")}</Text></View>
            <View style={styles.colHarga}><Text></Text></View>
            <View style={styles.colJml}><Text style={styles.bold}>{formatRp(grandTotal)}</Text></View>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Dibuat Oleh,</Text>
            <Text style={styles.signatureLine}>____________________</Text>
            <Text style={{ fontSize: 8 }}>Staf Umum &amp; Logistik</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Diketahui Oleh,</Text>
            <Text style={styles.signatureLine}>____________________</Text>
            <Text style={{ fontSize: 8 }}>Pemimpin Divisi Umum</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Dokumen ini sah dihasilkan secara elektronik oleh Sistem Inventaris Bank Sumut.
        </Text>
      </Page>
    </Document>
  );
};
