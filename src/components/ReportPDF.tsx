import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 11, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  logo: { width: 80, height: 60, marginRight: 12 },
  companyBlock: { flexDirection: 'row', flexGrow: 1, alignItems: 'flex-start' },
  companyInfo: { fontSize: 11, marginLeft: -10, justifyContent: 'flex-start' },
  companyTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 2, marginLeft: -2 },
  reportTitleBox: { flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, minWidth: 220 },
  reportTitle: { fontWeight: 'bold', fontSize: 10, textAlign: 'right', marginTop: 0, marginBottom: 0, lineHeight: 1.2, textTransform: 'uppercase', borderBottomWidth: 2, borderBottomColor: '#000', borderBottomStyle: 'solid', paddingBottom: 2 },
  table: { width: '100%', borderWidth: 1, borderColor: '#000', marginBottom: 8 },
  row: { flexDirection: 'row' },
  cell: { borderWidth: 1, borderColor: '#000', padding: 4, flex: 1 },
  cellSmall: { borderWidth: 1, borderColor: '#000', padding: 4, width: '5%' },
  cellLarge: { borderWidth: 1, borderColor: '#000', padding: 4, flex: 2 },
  sectionTitle: { backgroundColor: '#f2f2f2', fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  para: { borderWidth: 1, borderColor: '#000', padding: 10, marginTop: 12, fontSize: 10 },
  signatureRow: { flexDirection: 'row', marginTop: 16 },
  signatureCell: { borderWidth: 1, borderColor: '#000', height: 60, flex: 1, padding: 8, fontSize: 10 },
});

// Add a helper function for DD/MM/YYYY formatting
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const ReportPDF = ({ report }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.companyBlock}>
          <Image src={'/clogo.png'} style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyTitle}>MEDITRONIX CORPORATION</Text>
            <Text style={styles.bold}>G-236, Sector 63, Noida 201 301, Uttar Pradesh (INDIA)</Text>
            <Text style={styles.bold}>Tel: 0129 9232578, 2400609299,9910044344</Text>
            <Text style={styles.bold}>info@meditronixindia.com / www.meditronixcorporation.com</Text>
          </View>
        </View>
        <View style={styles.reportTitleBox}>
          <Text style={styles.reportTitle}>INSTALLATION/COMMISSIONING REPORT</Text>
        </View>
      </View>
      {/* Hospital Name and Date */}
      <View style={styles.table}>
        <View style={styles.row}>
          <View style={[styles.cell, { flex: 7 }]}> 
            <Text style={styles.bold}>Hospital's Name and Address</Text>
          </View>
          <View style={[styles.cell, { flex: 3 }]}> 
            <Text style={styles.bold}>Date of Installation:</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.cell, { flex: 7 }]}> 
            <Text>{report.hospitalName || ''}{report.customerDetails?.address ? `\n${report.customerDetails.address}` : ''}</Text>
          </View>
          <View style={[styles.cell, { flex: 3 }]}> 
            <Text>{formatDate(report.createdAt)}</Text>
          </View>
        </View>
      </View>
      {/* Customer/User Details and PO */}
      <View style={styles.table}>
        <View style={styles.row}>
          <View style={styles.cellLarge}>
            <Text style={styles.bold}>Customer / User's Detail</Text>
          </View>
          <View style={styles.cellLarge}>
            <Text style={styles.bold}>Reference of Purchase Order and Date</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.cellLarge}>
            <Text>Contact Person: {report.customerDetails?.name || ''}</Text>
            <Text>Designation: {report.customerDetails?.designation || ''}</Text>
            <Text>Department: {report.customerDetails?.department || ''}</Text>
            <Text>Mob-No: {report.customerDetails?.phone || ''}</Text>
            <Text>e-mail: {report.customerDetails?.email || ''}</Text>
          </View>
          <View style={styles.cellLarge}>
            <Text>PO No.: {report.customerDetails?.poOrderNo || ''}</Text>
            <Text>Purchase Date: {formatDate(report.customerDetails?.purchaseDate)}</Text>
          </View>
        </View>
      </View>
      {/* Product Table */}
      <View style={styles.table}>
        <View style={[styles.row, styles.sectionTitle]}>
          <Text style={[styles.cellSmall, styles.bold]}>S. No.</Text>
          <Text style={[styles.cellSmall, styles.bold]}>Qty.</Text>
          <Text style={[styles.cell, styles.bold]}>Product Name, Model and Si. No.</Text>
        </View>
        {(report.products || []).map((prod, idx) => (
          <View style={styles.row} key={idx}>
            <Text style={styles.cellSmall}>{idx + 1}</Text>
            <Text style={styles.cellSmall}>{prod.quantity || 1}</Text>
            <Text style={styles.cell}>{prod.name || ''}{prod.model ? ', ' + prod.model : ''}{prod.serialNo ? ', ' + prod.serialNo : ''}</Text>
          </View>
        ))}
        {(!report.products || report.products.length === 0) &&
          [0, 1, 2].map(i => (
            <View style={styles.row} key={i}>
              <Text style={styles.cellSmall}> </Text>
              <Text style={styles.cellSmall}> </Text>
              <Text style={styles.cell}> </Text>
            </View>
          ))}
      </View>
      {/* Paragraph */}
      <Text style={styles.para}>
        THE ABOVE EQUIPMENT(S), HAS/HAVE BEEN OPENED, INSTALLED AND HANDED OVER TO THE CUSTOMER IN SATISFACTORY CONDITION. (THE WARRANTY TERMS & WARRANTY SERVICE TERMS ARE AS PRINTED ON THE REVERSE OF THIS CERTIFICATE). WARRANTY WILL BE CONSIDERED AS PER PURCHASE ORDER.
      </Text>
      {/* Signatures */}
      <View style={styles.signatureRow}>
        <View style={styles.signatureCell}>
          <Text>Meditronix Engineer's Signature & Date</Text>
          {report.engineerSignature && (
            <Image src={report.engineerSignature} style={{ width: 120, height: 40, marginTop: 6 }} />
          )}
        </View>
        <View style={styles.signatureCell}>
          <Text>Customer's Signature, Date & Stamp</Text>
          {report.customerSignature && (
            <Image src={report.customerSignature} style={{ width: 120, height: 40, marginTop: 6 }} />
          )}
        </View>
      </View>
    </Page>
  </Document>
);

export default ReportPDF;