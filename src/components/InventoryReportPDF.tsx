import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica' },
  header: { marginBottom: 30, borderBottom: '2px solid #ff6b00' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoCircle: { width: 12, height: 12, backgroundColor: '#ff6b00', borderRadius: 6, marginRight: 5 },
  bankText: { fontSize: 16, fontWeight: 'bold' },
  bankOrange: { color: '#ff6b00' },
  bankBlue: { color: '#003366' },
  tagline: { fontSize: 8, color: '#003366', fontStyle: 'italic', marginBottom: 10 },
  title: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, textDecoration: 'underline' },
  infoSection: { marginBottom: 15, fontSize: 10 },
  table: { display: 'flex', width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#333' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333', minHeight: 25, alignItems: 'center' },
  tableColHeader: { backgroundColor: '#f0f0f0', fontWeight: 'bold' },
  colNo: { width: '8%', padding: 5, textAlign: 'center', borderRightWidth: 1, borderColor: '#333' },
  colName: { width: '32%', padding: 5, borderRightWidth: 1, borderColor: '#333' },
  colCat: { width: '15%', padding: 5, borderRightWidth: 1, borderColor: '#333', textAlign: 'center' },
  colStock: { width: '15%', padding: 5, borderRightWidth: 1, borderColor: '#333', textAlign: 'center' },
  colUnit: { width: '10%', padding: 5, borderRightWidth: 1, borderColor: '#333', textAlign: 'center' },
  colDate: { width: '20%', padding: 5, textAlign: 'center' },
  cellText: { fontSize: 9 },
  signatureSection: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
  signatureBox: { width: '40%', textAlign: 'center' },
  signatureLabel: { fontSize: 10, marginBottom: 50 },
  signatureName: { fontSize: 10, fontWeight: 'bold', textDecoration: 'underline' },
  signatureTitle: { fontSize: 8, color: '#666' },
  footer: { position: 'absolute', bottom: 30, left: 50, right: 50, textAlign: 'center', fontSize: 7, color: '#aaa' }
});

export const InventoryReportPDF = ({ data }: { data: any[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle} />
            <Text style={styles.bankText}>
              <Text style={styles.bankOrange}>Bank</Text> <Text style={styles.bankBlue}>SUMUT</Text>
            </Text>
          </View>
          <Text style={{ fontSize: 9, color: '#666' }}>Hal: 1 / 1</Text>
        </View>
        <Text style={styles.tagline}>Memberikan Pelayanan Terbaik</Text>
      </View>

      <Text style={styles.title}>LAPORAN PERSEDIAAN BARANG (INVENTARIS)</Text>
      
      <View style={styles.infoSection}>
        <Text>Tanggal Cetak : {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        <Text>Unit Kerja     : Kantor Pusat Medan</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableColHeader]}>
          <View style={styles.colNo}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>No</Text></View>
          <View style={styles.colName}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>Nama Barang</Text></View>
          <View style={styles.colCat}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>Kategori</Text></View>
          <View style={styles.colStock}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>Stok</Text></View>
          <View style={styles.colUnit}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>Satuan</Text></View>
          <View style={styles.colDate}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>Tgl Terakhir</Text></View>
        </View>
        {data.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.colNo}><Text style={styles.cellText}>{i + 1}</Text></View>
            <View style={styles.colName}><Text style={styles.cellText}>{item.name}</Text></View>
            <View style={styles.colCat}><Text style={styles.cellText}>{item.category}</Text></View>
            <View style={styles.colStock}><Text style={styles.cellText}>{item.stock}</Text></View>
            <View style={styles.colUnit}><Text style={styles.cellText}>{item.unit}</Text></View>
            <View style={styles.colDate}><Text style={styles.cellText}>{item.lastReceived || '-'}</Text></View>
          </View>
        ))}
      </View>

      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Dibuat Oleh,</Text>
          <Text style={styles.signatureName}>____________________</Text>
          <Text style={styles.signatureTitle}>Staf Umum & Logistik</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Diketahui Oleh,</Text>
          <Text style={styles.signatureName}>____________________</Text>
          <Text style={styles.signatureTitle}>Pemimpin Seksi Umum</Text>
        </View>
      </View>

      <Text style={styles.footer}>Dokumen ini sah dihasilkan secara elektronik oleh Sistem Inventaris Bank Sumut.</Text>
    </Page>
  </Document>
);
