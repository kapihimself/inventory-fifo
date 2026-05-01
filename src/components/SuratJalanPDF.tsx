import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottom: 1, paddingBottom: 10, borderColor: '#ff6b00' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#003366' },
  section: { marginBottom: 20 },
  row: { flexDirection: 'row', borderBottom: 0.5, borderColor: '#e5e7eb', paddingVertical: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', fontWeight: 'bold', paddingVertical: 8 },
  col1: { width: '10%' },
  col2: { width: '50%' },
  col3: { width: '20%', textAlign: 'center' },
  col4: { width: '20%', textAlign: 'center' },
  footer: { marginTop: 50, flexDirection: 'row', justifyContent: 'space-between' },
  signatureBox: { width: 150, textAlign: 'center' }
});

export const SuratJalanPDF = ({ distributionData }: { distributionData: any }) => {
  const data = distributionData || {};
  const branchName = data.branchName || "Cabang Tujuan";
  const items = data.items || [];
  const suratJalanNumber = data.suratJalanNumber || data.id || "SJ-DUMMY";
  const date = data.date || new Date().toLocaleDateString('id-ID');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>SURAT JALAN</Text>
            <Text>No: {suratJalanNumber}</Text>
            <Text>Tanggal: {date}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontWeight: 'bold', color: '#ff6b00' }}>Bank SUMUT</Text>
            <Text>Kantor Pusat - Divisi Umum</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Kepada Yth:</Text>
          <Text>{branchName}</Text>
          <Text>Bank Sumut</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}> No</Text>
            <Text style={styles.col2}> Nama Barang</Text>
            <Text style={styles.col3}> Jumlah</Text>
            <Text style={styles.col4}> Satuan</Text>
          </View>
          {items.map((item: any, i: number) => (
            <View key={i} style={styles.row}>
              <Text style={styles.col1}> {i + 1}</Text>
              <Text style={styles.col2}> {item.name}</Text>
              <Text style={styles.col3}> {item.quantity || item.qty || 0}</Text>
              <Text style={styles.col4}> {item.unit || 'Pcs'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text>Diserahkan Oleh,</Text>
            <View style={{ height: 60 }} />
            <Text>( ____________________ )</Text>
            <Text>Bagian Logistik</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Diterima Oleh,</Text>
            <View style={{ height: 60 }} />
            <Text>( ____________________ )</Text>
            <Text>Pimpinan Cabang</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
