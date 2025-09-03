import React from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
} from '@mui/material';
import {
  Download,
  TrendingUp,
  Assignment,
  FilterList,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { useReports, useInstallationTrend, useModelDistribution, useProductWiseInstallation, useRegionalPerformance } from '../hooks/useReports';
import ReportList from '../components/ReportList';
import * as XLSX from 'xlsx';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { HeatmapLayer } from '@react-google-maps/api';
import IndiaHeatmap from '../components/IndiaHeatmap';

// Static lookup for major Indian cities (expand as needed)
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'Delhi': { lat: 28.6139, lng: 77.209 },
  'Mumbai': { lat: 19.076, lng: 72.8777 },
  'Bengaluru': { lat: 12.9716, lng: 77.5946 },
  'Chennai': { lat: 13.0878, lng: 80.2785 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Hyderabad': { lat: 17.385, lng: 78.4867 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Kanpur': { lat: 26.4499, lng: 80.3319 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
  'Indore': { lat: 22.7196, lng: 75.8577 },
  'Bhopal': { lat: 23.2599, lng: 77.4126 },
  'Patna': { lat: 25.5941, lng: 85.1376 },
  'Ludhiana': { lat: 30.9005, lng: 75.8573 },
  'Agra': { lat: 27.1767, lng: 78.0081 },
  'Nashik': { lat: 19.9975, lng: 73.7898 },
  'Vadodara': { lat: 22.3072, lng: 73.1812 },
  'Varanasi': { lat: 25.3176, lng: 82.9739 },
  // Add more as needed
};

const INDIA_CENTER = { lat: 22.5, lng: 82.8 };
const MAP_CONTAINER_STYLE = { width: '100%', height: '400px', borderRadius: '16px' };

const Dashboard: React.FC = () => {
  const { reports, loading } = useReports();
  const installationTrend = useInstallationTrend(reports);
  const modelDistribution = useModelDistribution(reports);
  const productWise = useProductWiseInstallation(reports);
  const regionalPerformance = useRegionalPerformance(reports);

  // Summary metrics
  const totalReports = reports.length;
  const criticalCount = reports.filter(r => r.priority?.toLowerCase() === 'critical').length;
  const pendingCount = reports.filter(r => r.priority?.toLowerCase() === 'pending').length;
  const normalCount = reports.filter(r => r.priority?.toLowerCase() === 'normal').length;

  // Calculate average products per order
  const totalProducts = reports.reduce((sum, report) => {
    return sum + (report.products || []).reduce((productSum, product) => {
      return productSum + (product.quantity || 1);
    }, 0);
  }, 0);
  const avgProductsPerOrder = totalReports > 0 ? (totalProducts / totalReports).toFixed(1) : '0';

  // Calculate repeat installations (hospitals with multiple reports)
  const hospitalCounts = reports.reduce((acc, report) => {
    const hospitalName = report.hospitalName;
    acc[hospitalName] = (acc[hospitalName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const repeatInstallations = Object.values(hospitalCounts).filter(count => count > 1).length;

  // Export to Excel (Reports only)
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reports.map(report => ({
      'Hospital Name': report.hospitalName,
      'Priority': report.priority,
      'Created At': report.createdAt ? report.createdAt.toLocaleDateString('en-GB') : '',
      'Description': report.description,
      'Status': report.status,
      'Assigned To': report.assignedTo,
      'Category': report.category,
      'Feedback': report.feedback,
      'Products': (report.products || []).map(p => p.name).join(', '),
      'Location': report.customerDetails?.location || '',
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
    XLSX.writeFile(workbook, `reports-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const [openChart, setOpenChart] = React.useState<string | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const heatmapData = reports
    .map(r => {
      let lat = r.lat || r.customerDetails?.lat;
      let lng = r.lng || r.customerDetails?.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        return new window.google.maps.LatLng(lat, lng);
      }
      const city = cityCoordinates[r.hospitalName];
      if (city) {
        return new window.google.maps.LatLng(city.lat, city.lng);
      }
      return null;
    })
    .filter(Boolean);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography variant="h6" color="textSecondary">Loading dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  // Pie chart colors
  const pieColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD166', '#6A4C93', '#43cea2', '#185a9d'];

  // Calculate total for modelDistribution
  const totalModelCount = modelDistribution.reduce((sum, entry) => sum + entry.count, 0);
  const getPieLabel = (entry: any) => {
    const percent = totalModelCount > 0 ? ((entry.count / totalModelCount) * 100).toFixed(1) : '0';
    return `${entry.company}: ${entry.count} (${percent}%)`;
  };

  return (
    <div className="min-h-screen py-8 px-2 sm:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Export Data Button */}
        <div className="flex justify-end mb-4">
          <Button variant="contained" color="primary" startIcon={<Download />} onClick={exportToExcel}>
            Export Data
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="flex flex-wrap gap-6 mb-8">
          <div className="flex-1 min-w-[220px] max-w-[23%]">
            <div className="rounded-2xl bg-card border border-cardBorder text-textPrimary shadow-card p-6 transition-transform hover:-translate-y-2">
              <div className="text-lg font-semibold mb-2">Total Installations</div>
              <div className="text-4xl font-bold text-accent">{totalReports}</div>
            </div>
          </div>
          <div className="flex-1 min-w-[220px] max-w-[23%]">
            <div className="rounded-2xl bg-card border border-cardBorder text-textPrimary shadow-card p-6 transition-transform hover:-translate-y-2">
              <div className="text-lg font-semibold mb-2">Avg Products/Order</div>
              <div className="text-4xl font-bold text-accent2">{avgProductsPerOrder}</div>
            </div>
          </div>
          <div className="flex-1 min-w-[220px] max-w-[23%]">
            <div className="rounded-2xl bg-card border border-cardBorder text-textPrimary shadow-card p-6 transition-transform hover:-translate-y-2">
              <div className="text-lg font-semibold mb-2">Repeat Installations</div>
              <div className="text-4xl font-bold text-accent3">{repeatInstallations}</div>
            </div>
          </div>
          <div className="flex-1 min-w-[220px] max-w-[23%]">
            <div className="rounded-2xl bg-card border border-cardBorder text-textPrimary shadow-card p-6 transition-transform hover:-translate-y-2">
              <div className="text-lg font-semibold mb-2">Critical Cases</div>
              <div className="text-4xl font-bold text-badgeCritical">{criticalCount}</div>
            </div>
          </div>
        </div>

        {/* Activity Heatmap by City */}
        <div className="mb-8">
          <div className="text-xl font-bold text-accent mb-4">Regional Performance Across Country</div>
          <IndiaHeatmap />
        </div>

        {/* Charts Section */}
        <div className="flex flex-wrap gap-6 mb-8">
          {/* Installation Trend */}
          <div className="flex-2 min-w-[400px] max-w-[66%] min-h-[440px]">
            <div className="rounded-2xl bg-card border border-cardBorder shadow-card min-h-[440px] p-6 cursor-pointer" onClick={() => setOpenChart('installationTrend')}>
              <div className="text-xl font-bold text-accent mb-4">Installation Trend (Reports per Month)</div>
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={installationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="url(#lineGradient)"
                      strokeWidth={3}
                      dot={{ fill: '#2196F3', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#2196F3', strokeWidth: 2 }}
                    />
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#2196F3" />
                        <stop offset="100%" stopColor="#21CBF3" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <Dialog open={openChart === 'installationTrend'} onClose={() => setOpenChart(null)} maxWidth="lg" fullWidth>
            <DialogTitle>Installation Trend (Reports per Month)</DialogTitle>
            <DialogContent>
              <div style={{ width: '100%', height: 600 }}>
                <ResponsiveContainer width="100%" height={600}>
                  <LineChart data={installationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="url(#lineGradient)"
                      strokeWidth={3}
                      dot={{ fill: '#2196F3', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#2196F3', strokeWidth: 2 }}
                    />
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#2196F3" />
                        <stop offset="100%" stopColor="#21CBF3" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DialogContent>
          </Dialog>

          {/* Model Distribution */}
          <div className="flex-1 min-w-[340px] max-w-[32%] min-h-[440px]">
            <div className="rounded-2xl bg-card border border-cardBorder shadow-card min-h-[440px] p-6 cursor-pointer" onClick={() => setOpenChart('modelDistribution')}>
              <div className="text-xl font-bold text-accent mb-4">Model Distribution (Company of Origin)</div>
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={modelDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={getPieLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {modelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <Dialog open={openChart === 'modelDistribution'} onClose={() => setOpenChart(null)} maxWidth="lg" fullWidth>
            <DialogTitle>Model Distribution (Company of Origin)</DialogTitle>
            <DialogContent>
              <div style={{ width: '100%', height: 600 }}>
                <ResponsiveContainer width="100%" height={600}>
                  <PieChart>
                    <Pie
                      data={modelDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={getPieLabel}
                      outerRadius={180}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {modelDistribution.map((entry, index) => (
                        <Cell key={`cell-modal-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DialogContent>
          </Dialog>

          {/* Product-wise Installation */}
          <div className="flex-2 min-w-[600px] max-w-[100%] min-h-[600px] mt-4 cursor-pointer" onClick={() => setOpenChart('productWise')}>
            <div className="rounded-2xl bg-card border border-cardBorder shadow-card min-h-[600px] p-6">
              <div className="text-xl font-bold text-accent mb-4">Product-wise Installation</div>
              <div className="w-full h-[550px]">
                <ResponsiveContainer width="100%" height={550}>
                  <LineChart data={productWise}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="url(#productLineGradient)"
                      strokeWidth={3}
                      dot={{ fill: '#43cea2', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#43cea2', strokeWidth: 2 }}
                    />
                    <defs>
                      <linearGradient id="productLineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#43cea2" />
                        <stop offset="100%" stopColor="#185a9d" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <Dialog open={openChart === 'productWise'} onClose={() => setOpenChart(null)} maxWidth="lg" fullWidth>
            <DialogTitle>Product-wise Installation</DialogTitle>
            <DialogContent>
              <div style={{ width: '100%', height: 600 }}>
                <ResponsiveContainer width="100%" height={600}>
                  <LineChart data={productWise}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="url(#productLineGradient)"
                      strokeWidth={3}
                      dot={{ fill: '#43cea2', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#43cea2', strokeWidth: 2 }}
                    />
                    <defs>
                      <linearGradient id="productLineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#43cea2" />
                        <stop offset="100%" stopColor="#185a9d" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
