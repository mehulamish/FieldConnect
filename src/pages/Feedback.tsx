import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Card,
  CardContent,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  InputAdornment,
  CircularProgress,
  Divider
} from '@mui/material';
import { Search, Feedback as FeedbackIcon } from '@mui/icons-material';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Report } from '../types';

const formatDate = (date: Date) => date instanceof Date && !isNaN(date.getTime()) ? date.toLocaleDateString('en-GB') : '-';

const FeedbackPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<Report | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'Reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const reportsData: Report[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reportsData.push({
          id: doc.id,
          hospitalName: data.hospitalName || data.customerDetails?.hospitalName || 'Unknown Hospital',
          priority: data.priority || 'normal',
          feedback: data.feedback || '',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          customerDetails: data.customerDetails || {},
        } as Report);
      });
      setReports(reportsData);
      setLoading(false);

      // --- Auto-move logic ---
      // Find all new 'normal' reports
      const normalReports = reportsData.filter(r => r.priority?.toLowerCase() === 'normal');
      // For each, check if there is a pending report with the same hospitalName
      for (const normal of normalReports) {
        const pending = reportsData.find(r => r.priority?.toLowerCase() === 'pending' && r.hospitalName === normal.hospitalName);
        if (pending) {
          // Update the pending report's priority to 'normal'
          const pendingRef = doc(db, 'Reports', pending.id);
          await updateDoc(pendingRef, { priority: 'normal' });
        }
      }
      // --- End auto-move logic ---
    });
    return () => unsubscribe();
  }, []);

  // Only show reports with feedback
  const feedbackReports = reports.filter(r => r.feedback && r.feedback.trim() !== '');

  // Filter by search term
  const filteredFeedback = feedbackReports.filter(item =>
    item.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.customerDetails?.poOrderNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.feedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.priority.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort by priority (critical > pending > normal)
  const priorityOrder = { 'critical': 0, 'pending': 1, 'normal': 2 };
  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    return (priorityOrder[a.priority?.toLowerCase()] ?? 3) - (priorityOrder[b.priority?.toLowerCase()] ?? 3);
  });

  // Priority counts
  const criticalCount = feedbackReports.filter(f => f.priority?.toLowerCase() === 'critical').length;
  const pendingCount = feedbackReports.filter(f => f.priority?.toLowerCase() === 'pending').length;
  const normalCount = feedbackReports.filter(f => f.priority?.toLowerCase() === 'normal').length;
  const totalCount = feedbackReports.length;

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedFeedback(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'pending': return 'warning';
      case 'normal': return 'success';
      default: return 'default';
    }
  };

  const handleSetPending = async (reportId: string) => {
    const reportRef = doc(db, 'Reports', reportId);
    await updateDoc(reportRef, { priority: 'pending' });
  };

  const handleSetResolved = async (reportId: string) => {
    const reportRef = doc(db, 'Reports', reportId);
    await updateDoc(reportRef, { priority: 'normal' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f6fbff 0%, #e0eafc 100%)',
      py: 4
    }}>
      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Card sx={{ borderRadius: 4, boxShadow: 2, background: '#fff', textAlign: 'center', p: 0, backgroundColor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h3" fontWeight={700} letterSpacing={1} color="#1976d2">{totalCount}</Typography>
              <Typography variant="h6" fontWeight={500} color="#1976d2">Total Feedback</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Card sx={{ borderRadius: 4, boxShadow: 2, background: '#fff', textAlign: 'center', p: 0, backgroundColor: '#ffeaea' }}>
            <CardContent>
              <Typography variant="h3" fontWeight={700} color="#e53935">{criticalCount}</Typography>
              <Typography variant="h6" fontWeight={500} color="#e53935">Critical</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Card sx={{ borderRadius: 4, boxShadow: 2, background: '#fff', textAlign: 'center', p: 0, backgroundColor: '#fff8e1' }}>
            <CardContent>
              <Typography variant="h3" fontWeight={700} color="#fbc02d">{pendingCount}</Typography>
              <Typography variant="h6" fontWeight={500} color="#fbc02d">Pending</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Card sx={{ borderRadius: 4, boxShadow: 2, background: '#fff', textAlign: 'center', p: 0, backgroundColor: '#e8f5e9' }}>
            <CardContent>
              <Typography variant="h3" fontWeight={700} color="#388e3c">{normalCount}</Typography>
              <Typography variant="h6" fontWeight={500} color="#388e3c">Normal</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ background: '#fff', borderRadius: 3, boxShadow: '0 4px 24px 0 rgba(25, 118, 210, 0.08)', p: 2, mb: 4, maxWidth: 600, mx: 'auto' }}>
        <TextField
          fullWidth
          placeholder="search by institute name or PO no..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#888', fontSize: 28 }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 3,
              background: '#f6fbff',
              fontSize: 18,
              height: 56
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              background: '#f6fbff',
              fontSize: 18,
              boxShadow: '0 2px 8px 0 rgba(25, 118, 210, 0.04)'
            }
          }}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Priority Sections for Feedback by Priority */}
      {[
        { label: 'Critical', color: '#e53935', bg: '#ffeaea', feedbacks: sortedFeedback.filter(f => f.priority?.toLowerCase() === 'critical') },
        { label: 'Pending', color: '#fbc02d', bg: '#fff8e1', feedbacks: sortedFeedback.filter(f => f.priority?.toLowerCase() === 'pending') },
        { label: 'Normal', color: '#388e3c', bg: '#e8f5e9', feedbacks: sortedFeedback.filter(f => f.priority?.toLowerCase() === 'normal') },
      ].map(({ label, color, bg, feedbacks }) => (
        <Box key={label} sx={{ mb: 6, background: bg, borderRadius: 4, boxShadow: '0 2px 16px 0 rgba(25, 118, 210, 0.04)', p: 0, pt: 1.5 }}>
          <Box sx={{ display: 'inline-block', px: 3, py: 1, background: color, color: '#fff', borderRadius: '0 0 8px 0', fontWeight: 700, fontSize: 20, mb: 2, ml: 2, boxShadow: '0 2px 8px 0 rgba(25, 118, 210, 0.04)' }}>
            {label} ({feedbacks.length})
          </Box>
          <Box display="flex" flexWrap="wrap" gap={3} px={2} pb={2}>
            {feedbacks.length === 0 ? (
              <Box sx={{ flexBasis: '100%', maxWidth: '100%' }}>
                <Card sx={{ p: 3, textAlign: 'center', borderRadius: 3, boxShadow: 1, background: '#fff' }}>
                  <Typography variant="body2" color="textSecondary">No feedback</Typography>
                </Card>
              </Box>
            ) : (
              feedbacks.map((item) => (
                <Box key={item.id} sx={{ flexBasis: { xs: '100%', sm: '48%', md: '31%', lg: '23%' }, maxWidth: { xs: '100%', sm: '48%', md: '31%', lg: '23%' }, minWidth: 250 }}>
                  <Card sx={{
                    borderRadius: 3,
                    boxShadow: '0 2px 8px 0 rgba(25, 118, 210, 0.08)',
                    background: '#fff',
                    p: 2,
                    mb: 2,
                    border: '1.5px solid #e3eafc',
                    '&:hover': { boxShadow: 4 }
                  }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box mb={1}>
                        
                        <Typography variant="body2" color="textSecondary" fontWeight={600}>
                          PO no.: {item.customerDetails?.poOrderNo || '-'}
                        </Typography>
                        
                      </Box>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'Roboto, Arial, sans-serif', color: '#222' }}>
                          {item.hospitalName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" fontWeight={500}>
                          {formatDate(item.createdAt)}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2" color="textSecondary" mt={1} fontWeight={600}>
                        Feedback:
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line', fontWeight: 400, color: '#333' }}>
                        {item.feedback}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        
                      </Box>
                      {/* Add Pending and Resolved buttons for Critical section only */}
                      {label === 'Critical' && (
                        <Box display="flex" gap={2} mt={2}>
                          <Button variant="outlined" color="warning" onClick={() => handleSetPending(item.id)}>
                            Pending
                          </Button>
                          <Button variant="contained" color="success" onClick={() => handleSetResolved(item.id)}>
                            Resolved
                          </Button>
                        </Box>
                      )}
                      {/* Add Resolved button for Pending section only */}
                      {label === 'Pending' && (
                        <Box display="flex" gap={2} mt={2}>
                          <Button variant="contained" color="success" onClick={() => handleSetResolved(item.id)}>
                            Resolved
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              ))
            )}
          </Box>
        </Box>
      ))}

      {/* Feedback Detail Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white',
          fontWeight: 600
        }}>
          Feedback Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedFeedback && (
            <Box>
              <Box mb={3}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Hospital Name
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {selectedFeedback.hospitalName}
                </Typography>
              </Box>
              <Box mb={3}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Priority
                </Typography>
                <Chip
                  label={selectedFeedback.priority}
                  color={getPriorityColor(selectedFeedback.priority) as any}
                  size="medium"
                  sx={{ fontWeight: 600, mb: 2 }}
                />
              </Box>
              <Box mb={3}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Created At
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(selectedFeedback.createdAt)}
                </Typography>
              </Box>
              <Box mb={3}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Feedback
                </Typography>
                <Box sx={{
                  p: 3,
                  backgroundColor: 'rgba(33, 150, 243, 0.05)',
                  borderRadius: 2,
                  borderLeft: 4,
                  borderLeftColor: `${getPriorityColor(selectedFeedback.priority)}.main`
                }}>
                  <Typography variant="body1">
                    {selectedFeedback.feedback}
                  </Typography>
                </Box>
              </Box>
              {selectedFeedback.reportId && (
                <Box mb={3}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Related Report ID
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    p: 1,
                    borderRadius: 1,
                    display: 'inline-block'
                  }}>
                    {selectedFeedback.reportId}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 4,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeedbackPage;
