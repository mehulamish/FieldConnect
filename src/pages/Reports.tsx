import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  Assignment, 
  Warning, 
  CheckCircle, 
  Schedule,
  LocalHospital,
  Search,
  Download,
  Visibility,
  Person,
  Business,
  Inventory,
  Description
} from '@mui/icons-material';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { testFirebaseConnection, listAllCollections } from '../lib/firebase-test';
import { Report } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom';
import ReportPDF from '../components/ReportPDF';
import { pdf } from '@react-pdf/renderer';

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const pdfRef = React.useRef<HTMLDivElement>(null);
  const [pdfExportReport, setPdfExportReport] = useState<Report | null>(null);
  const [shouldExportPdf, setShouldExportPdf] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 Starting to fetch reports from Firebase...');
    console.log('🏥 Checking collection: Reports');
    console.log('📊 Database object:', db);
    console.log('🔧 Environment check:');
    console.log('  - VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Not set');
    console.log('  - VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Set' : 'Not set');
    console.log('  - VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Not set');
    
    const reportsRef = collection(db, 'Reports');
    console.log('📁 Collection reference:', reportsRef);
    console.log('📁 Collection path:', reportsRef.path);
    console.log('📁 Collection id:', reportsRef.id);
    
    const q = query(
      reportsRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📊 Firebase snapshot received:', snapshot.size, 'documents');
        console.log('📊 Snapshot empty:', snapshot.empty);
        console.log('📊 Snapshot metadata:', snapshot.metadata);
        
        if (snapshot.empty) {
          console.log('⚠️ No documents found in "Reports" collection');
          console.log('💡 Possible issues:');
          console.log('   1. Collection "Reports" doesn\'t exist');
          console.log('   2. Collection name might be different (case sensitive)');
          console.log('   3. Firestore security rules might be blocking access');
          console.log('   4. No documents in the collection');
          console.log('   5. Environment variables not set correctly');
        }
        
        const reportsData: Report[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📄 Document data:', doc.id, data);
          console.log('📄 Document keys:', Object.keys(data));
          
          reportsData.push({
            id: doc.id,
            hospitalName: data.hospitalName || data.customerDetails?.hospitalName || 'Unknown Hospital',
            priority: data.priority || 'Normal',
            feedback: data.feedback || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate() || data.syncedAt?.toDate() || new Date(),
            description: data.description || '',
            status: data.status || 'Pending',
            assignedTo: data.assignedTo || '',
            category: data.category || '',
            createdBy: data.createdBy,
            customerDetails: data.customerDetails,
            customerSignature: data.customerSignature,
            engineerSignature: data.engineerSignature,
            pdfUrl: data.pdfUrl,
            products: data.products,
            reportId: data.reportId,
            stamp: data.stamp,
            syncedAt: data.syncedAt?.toDate(),
            timestamp: data.timestamp
          });
        });
        
        console.log('✅ Processed reports:', reportsData.length);
        console.log('📋 Final reports data:', reportsData);
        setReports(reportsData);
        setFilteredReports(reportsData);
        setLoading(false);
      },
      (err) => {
        console.error('❌ Error fetching reports:', err);
        console.error('❌ Error code:', err.code);
        console.error('❌ Error message:', err.message);
        console.error('❌ Error stack:', err.stack);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter(report =>
        report.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.customerDetails?.poOrderNo || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReports(filtered);
    }
  }, [searchTerm, reports]);

  const handleDownload = async (report) => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const html = generateReportHTML(report);
    await doc.html(html, {
      callback: function (doc) {
        doc.save(`Report_${report.hospitalName || 'Unknown'}.pdf`);
      },
      margin: [20, 20, 20, 20],
      autoPaging: 'text',
      x: 0,
      y: 0,
      width: 555 // a4 page width in pt minus margins
    });
  };

  useEffect(() => {
    if (shouldExportPdf && pdfExportReport && pdfRef.current) {
      setTimeout(async () => {
        if (pdfRef.current) {
          try {
            const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, allowTaint: true, logging: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Report_${pdfExportReport.hospitalName || 'Unknown'}.pdf`);
          } catch (err) {
            alert('Failed to generate PDF. Please try again.');
          } finally {
            setShouldExportPdf(false);
            setPdfExportReport(null);
            setPdfLoadingId(null);
          }
        }
      }, 200);
    }
  }, [shouldExportPdf, pdfExportReport]);

  const handlePreview = (report: Report) => {
    setSelectedReport(report);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedReport(null);
  };

  // Helper function for safe date formatting
  const formatPurchaseDate = (customerDetails: any) => {
    if (customerDetails && typeof customerDetails.purchaseDate !== 'undefined') {
      const val = customerDetails.purchaseDate;
      if (typeof val === 'string' || typeof val === 'number' || val instanceof Date) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) return date.toLocaleDateString();
      }
    }
    return '-';
  };

  // Helper to format date as DD/MM/YY
  const formatDate = (date: Date) => date.toLocaleDateString("en-GB");

  // Function to generate HTML string for a report
  function generateReportHTML(report) {
    return `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; }
          table { width: 100%; border-collapse: collapse; }
          td, th { border: 1px solid black; padding: 6px; vertical-align: top; }
          .no-border { border: none; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; }
          .logo { width: 80px; height: auto; }
          .company-info { font-size: 14px; line-height: 1.5; margin-left: 10px; flex-grow: 1; }
          .report-title { font-weight: bold; font-size: 14px; text-align: right; margin-top: 10px; }
          .section-title { background-color: #f2f2f2; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${report.logoUrl || '/logo.png'}" alt="MEC Logo" class="logo">
          <div class="company-info">
            <strong>MEDITRONIX CORPORATION</strong><br>
            6-230, Sector 63, Noida 301 395, Uttar Pradesh (INDIA)<br>
            Tel: 0129 9232578, 2400609299, 9910043444<br>
            info@meditronixindia.com / www.meditronixcorporation.com
          </div>
          <div class="report-title">
            INSTALLATION/COMMISSIONING REPORT
          </div>
        </div>
        <br><br>
        <table>
          <tr>
            <td style="width: 70%;">${report.hospitalName || ''}${report.customerDetails?.address ? '<br>' + report.customerDetails.address : ''}</td>
            <td style="width: 30%;">Date of Installation: ${formatDate(report.createdAt)}</td>
          </tr>
        </table>
        <table>
          <tr>
            <td style="width: 50%;">
              <strong>Customer / User's Detail</strong><br><br>
              Contact Person: ${report.customerDetails?.name || ''}<br>
              Designation: ${report.customerDetails?.designation || ''}<br>
              Department: ${report.customerDetails?.department || ''}<br>
              Mob-No: ${report.customerDetails?.phone || ''}<br>
              e-mail: ${report.customerDetails?.email || ''}
            </td>
            <td style="width: 50%;">
              <strong>Reference of Purchase Order and Date</strong><br>
              PO No.: ${report.customerDetails?.poOrderNo || ''}<br>
              Purchase Date: ${report.customerDetails && 'purchaseDate' in report.customerDetails && (typeof report.customerDetails.purchaseDate === 'string' || typeof report.customerDetails.purchaseDate === 'number' || report.customerDetails.purchaseDate instanceof Date)
                ? formatDate(new Date(report.customerDetails.purchaseDate))
                : ''}
            </td>
          </tr>
        </table>
        <table>
          <tr class="section-title">
            <td style="width: 5%;">S. No.</td>
            <td style="width: 5%;">Qty.</td>
            <td>Product Name, Model and Si. No.</td>
          </tr>
          ${(report.products || []).map((prod, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${prod.quantity || 1}</td>
              <td>${prod.name || ''}${prod.model ? ', ' + prod.model : ''}${prod.serialNo ? ', ' + prod.serialNo : ''}</td>
            </tr>
          `).join('')}
          ${(!report.products || report.products.length === 0) ? `<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>` : ''}
        </table>
        <p style="border: 1px solid black; padding: 10px; margin-top: 20px;">
          THE ABOVE EQUIPMENT(S), HAS/HAVE BEEN OPENED, INSTALLED AND HANDED OVER TO THE CUSTOMER IN SATISFACTORY CONDITION.
          (THE WARRANTY TERMS & WARRANTY SERVICE TERMS ARE AS PRINTED ON THE REVERSE OF THIS CERTIFICATE). WARRANTY WILL BE CONSIDERED AS PER PURCHASE ORDER.
        </p>
        <table>
          <tr>
            <td style="width: 50%; height: 80px;">Meditronix Engineer's Signature & Date</td>
            <td style="width: 50%;">Customer's Signature, Date & Stamp</td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  const handleDownloadPDF = async (report: Report) => {
    if (report.pdfUrl) {
      try {
        const response = await fetch(report.pdfUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report_${report.hospitalName || 'Unknown'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        alert('Failed to download PDF from storage.');
      }
    } else {
      alert('No PDF available for this report.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  return (
    <div className="min-h-screen py-8 px-2 sm:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col gap-2">
          <div className="text-4xl font-bold text-textPrimary mb-1">Reports</div>
          <div className="text-lg text-textSecondary">View and Download all reports from the database</div>
        </div>
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Institute Name or PO No."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl pl-12 pr-5 py-3 bg-card border border-cardBorder shadow-soft text-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-textSecondary"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-textSecondary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
            </span>
          </div>
        </div>
        <div className="rounded-2xl bg-card border border-cardBorder shadow-card p-6">
          <div className="text-2xl font-bold text-textPrimary mb-4">All Reports <span className="text-base font-normal text-textSecondary">(Recent First)</span></div>
          <div className="flex flex-col gap-4">
            {filteredReports.map(report => (
              <div key={report.id} className="rounded-xl bg-background border border-cardBorder p-4 flex flex-col gap-1 shadow-soft">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xl font-bold text-textPrimary">{report.hospitalName}</span>
                  <span className={`px-3 py-1 rounded-xl text-sm font-semibold
                    ${report.priority === 'Pending' ? 'bg-badgePendingBg text-badgePending' : report.priority === 'Critical' ? 'bg-badgeCriticalBg text-badgeCritical' : 'bg-badgeNormalBg text-badgeNormal'}`}>{report.priority}</span>
                  <span className="ml-auto text-xs bg-card rounded px-2 py-1 text-textSecondary border border-cardBorder">ID: {report.id}</span>
                </div>
                <div className="text-sm text-textSecondary mb-1">{formatDate(report.createdAt)} &mdash; Customer: {report.customerDetails?.name || report.createdBy}</div>
                <div className="flex gap-2 mt-1">
                  <button
                    className="px-4 py-2 rounded-xl bg-accent/10 text-accent font-semibold text-sm hover:bg-accent/20 transition"
                    onClick={() => handlePreview(report)}
                  >
                    Preview
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-accent2/10 text-accent2 font-semibold text-sm hover:bg-accent2/20 transition flex items-center gap-2"
                    onClick={() => handleDownloadPDF(report)}
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'none' }}>
        {(pdfExportReport || selectedReport) && (
          <div ref={pdfRef} style={{ width: 794, minHeight: 1123, padding: 24, background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', fontSize: 14 }}>
            {(() => {
              const report = pdfExportReport || selectedReport;
              if (!report) return null;
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 22 }}>MEDITRONIX CORPORATION</div>
                      <div style={{ fontSize: 12 }}>6-230, Sector 63, Noida 301 395, Utta/Pradesh (INDIA)</div>
                      <div style={{ fontSize: 12 }}>Tel: 0129 9232578, 2400609299, 9910043444</div>
                      <div style={{ fontSize: 12 }}>info@meditronixindia.com / www.meditronixcorporation.com</div>
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: 16, textAlign: 'right' }}>INSTALLATION/COMMISSIONING REPORT</div>
                  </div>
                  <div style={{ border: '1px solid #000', marginTop: 16 }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                      <div style={{ flex: 2, borderRight: '1px solid #000', padding: 8 }}>
                        Hospital's Name and Address:<br />
                        {report.hospitalName}
                      </div>
                      <div style={{ flex: 1, padding: 8 }}>
                        Date of Installation: {formatDate(report.createdAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                      <div style={{ flex: 2, borderRight: '1px solid #000', padding: 8 }}>
                        Customer / User's Detail:<br />
                        Contact Person: {report.customerDetails?.name}<br />
                        Designation: {report.customerDetails?.designation}<br />
                        Department: {report.customerDetails?.department}<br />
                        Mob-No.: {report.customerDetails?.phone}<br />
                        a-mail: {report.customerDetails?.email}
                      </div>
                      <div style={{ flex: 1, padding: 8 }}>
                        Reference of Purchase Order and Date:<br />
                        PO No.: {report.customerDetails?.poOrderNo || '-'}<br />
                        Purchase Date: {report.customerDetails && 'purchaseDate' in report.customerDetails && (typeof report.customerDetails.purchaseDate === 'string' || typeof report.customerDetails.purchaseDate === 'number' || report.customerDetails.purchaseDate instanceof Date)
                          ? formatDate(new Date(report.customerDetails.purchaseDate))
                          : ''}
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid #000', display: 'flex', fontWeight: 'bold', background: '#f0f0f0' }}>
                      <div style={{ width: 40, borderRight: '1px solid #000', padding: 4 }}>S. No.</div>
                      <div style={{ width: 60, borderRight: '1px solid #000', padding: 4 }}>Qty.</div>
                      <div style={{ flex: 1, padding: 4 }}>Product Name, Model and Si. No.</div>
                    </div>
                    {(report.products || []).map((prod: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
                        <div style={{ width: 40, borderRight: '1px solid #ccc', padding: 4 }}>{idx + 1}</div>
                        <div style={{ width: 60, borderRight: '1px solid #ccc', padding: 4 }}>{prod.qty || 1}</div>
                        <div style={{ flex: 1, padding: 4 }}>{prod.name} {prod.model ? `, ${prod.model}` : ''} {prod.serial ? `, ${prod.serial}` : ''}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ border: '1px solid #000', borderTop: 'none', padding: 8, marginTop: 8 }}>
                    THE ABOVE EQUIPMENT(S), HAS/HAVE BEEN OPENED, INSTALLED AND HANDED OVER TO THE CUSTOMER IN SATISFACTORY CONDITION. (THE WARRANTY TERMS & WARRANTY SERVICE TERMS ARE AS PRINTED ON THE REVERSE OF THIS CERTIFICATE). WARRANTY WILL BE CONSIDERED AS PER PURCHASE ORDER.
                  </div>
                  <div style={{ display: 'flex', border: '1px solid #000', borderTop: 'none' }}>
                    <div style={{ flex: 1, borderRight: '1px solid #000', padding: 8 }}>
                      Meditronix Engineer's Signature & Date
                      <div style={{ minHeight: 40 }}>
                        {report.engineerSignature && (
                          <img src={report.engineerSignature} alt="Engineer Signature" style={{ maxWidth: 180, maxHeight: 60, marginTop: 4 }} crossOrigin="anonymous" />
                        )}
                      </div>
                    </div>
                    <div style={{ flex: 1, padding: 8 }}>
                      Customer's Signature, Date & Stamp
                      <div style={{ minHeight: 40 }}>
                        {report.customerSignature && (
                          <img src={report.customerSignature} alt="Customer Signature" style={{ maxWidth: 180, maxHeight: 60, marginTop: 4 }} crossOrigin="anonymous" />
                        )}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>Report Preview</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <div style={{ width: '100%', minHeight: 600, background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 22 }}>MEDITRONIX CORPORATION</div>
                  <div style={{ fontSize: 12 }}>6-230, Sector 63, Noida 301 395, Utta/Pradesh (INDIA)</div>
                  <div style={{ fontSize: 12 }}>Tel: 0129 9232578, 2400609299, 9910043444</div>
                  <div style={{ fontSize: 12 }}>info@meditronixindia.com / www.meditronixcorporation.com</div>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: 16, textAlign: 'right' }}>INSTALLATION/COMMISSIONING REPORT</div>
              </div>
              <div style={{ border: '1px solid #000', marginTop: 16 }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                  <div style={{ flex: 2, borderRight: '1px solid #000', padding: 8 }}>
                    Hospital's Name and Address:<br />
                    {selectedReport.hospitalName}
                  </div>
                  <div style={{ flex: 1, padding: 8 }}>
                    Date of Installation: {formatDate(selectedReport.createdAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                  <div style={{ flex: 2, borderRight: '1px solid #000', padding: 8 }}>
                    Customer / User's Detail:<br />
                    Contact Person: {selectedReport.customerDetails?.name}<br />
                    Designation: {selectedReport.customerDetails?.designation}<br />
                    Department: {selectedReport.customerDetails?.department}<br />
                    Mob-No.: {selectedReport.customerDetails?.phone}<br />
                    a-mail: {selectedReport.customerDetails?.email}
                  </div>
                  <div style={{ flex: 1, padding: 8 }}>
                    Reference of Purchase Order and Date:<br />
                    PO No.: {selectedReport.customerDetails?.poOrderNo || '-'}<br />
                    Purchase Date: {selectedReport.customerDetails && 'purchaseDate' in selectedReport.customerDetails && selectedReport.customerDetails.purchaseDate && (typeof selectedReport.customerDetails.purchaseDate === 'string' || typeof selectedReport.customerDetails.purchaseDate === 'number' || selectedReport.customerDetails.purchaseDate instanceof Date)
                      ? formatDate(new Date(selectedReport.customerDetails.purchaseDate))
                      : ''}
                  </div>
                </div>
                <div style={{ borderBottom: '1px solid #000', display: 'flex', fontWeight: 'bold', background: '#f0f0f0' }}>
                  <div style={{ width: 40, borderRight: '1px solid #000', padding: 4 }}>S. No.</div>
                  <div style={{ width: 60, borderRight: '1px solid #000', padding: 4 }}>Qty.</div>
                  <div style={{ flex: 1, padding: 4 }}>Product Name, Model and Si. No.</div>
                </div>
                {(selectedReport.products || []).map((prod: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
                    <div style={{ width: 40, borderRight: '1px solid #ccc', padding: 4 }}>{idx + 1}</div>
                    <div style={{ width: 60, borderRight: '1px solid #ccc', padding: 4 }}>{prod.qty || 1}</div>
                    <div style={{ flex: 1, padding: 4 }}>{prod.name} {prod.model ? `, ${prod.model}` : ''} {prod.serial ? `, ${prod.serial}` : ''}</div>
                  </div>
                ))}
              </div>
              <div style={{ border: '1px solid #000', borderTop: 'none', padding: 8, marginTop: 8 }}>
                THE ABOVE EQUIPMENT(S), HAS/HAVE BEEN OPENED, INSTALLED AND HANDED OVER TO THE CUSTOMER IN SATISFACTORY CONDITION. (THE WARRANTY TERMS & WARRANTY SERVICE TERMS ARE AS PRINTED ON THE REVERSE OF THIS CERTIFICATE). WARRANTY WILL BE CONSIDERED AS PER PURCHASE ORDER.
              </div>
              <div style={{ display: 'flex', border: '1px solid #000', borderTop: 'none' }}>
                <div style={{ flex: 1, borderRight: '1px solid #000', padding: 8 }}>
                  Meditronix Engineer's Signature & Date
                  <div style={{ minHeight: 40 }}>
                    {selectedReport.engineerSignature && (
                      <img src={selectedReport.engineerSignature} alt="Engineer Signature" style={{ maxWidth: 180, maxHeight: 60, marginTop: 4 }} crossOrigin="anonymous" />
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, padding: 8 }}>
                  Customer's Signature, Date & Stamp
                  <div style={{ minHeight: 40 }}>
                    {selectedReport.customerSignature && (
                      <img src={selectedReport.customerSignature} alt="Customer Signature" style={{ maxWidth: 180, maxHeight: 60, marginTop: 4 }} crossOrigin="anonymous" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>
      <style>{`
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`}</style>
    </div>
  );
};

export default Reports; 