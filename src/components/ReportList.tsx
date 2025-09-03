import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Chip,
  Typography,
  Box,
  Avatar,
  Divider
} from '@mui/material';
import { Assignment, LocalHospital } from '@mui/icons-material';
import { Report } from '../types';

interface ReportListProps {
  reports: Report[];
  title?: string;
  maxItems?: number;
}

const ReportList: React.FC<ReportListProps> = ({ reports, title, maxItems = 10 }) => {
  const displayReports = reports.slice(0, maxItems);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'pending': return 'warning';
      default: return 'success';
    }
  };

  const getPriorityIcon = (priority: string) => {
    const color = getPriorityColor(priority);
    return (
      <Avatar sx={{ 
        bgcolor: `${color}.main`, 
        width: 40, 
        height: 40,
        mr: 2 
      }}>
        <Assignment sx={{ fontSize: 20 }} />
      </Avatar>
    );
  };

  return (
    <Box>
      {title && (
        <Box display="flex" alignItems="center" mb={3}>
          <LocalHospital sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" fontWeight="600" color="primary">
            {title}
          </Typography>
        </Box>
      )}
      <List sx={{ width: '100%' }}>
        {displayReports.map((report, index) => (
          <Box key={report.id}>
            <ListItem 
              sx={{ 
                px: 0,
                py: 2,
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.04)',
                  borderRadius: 2,
                  transition: 'background-color 0.3s ease'
                }
              }}
            >
              {getPriorityIcon(report.priority)}
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Typography variant="h6" fontWeight="600">
                      {report.hospitalName}
                    </Typography>
                    <Chip
                      label={report.priority}
                      color={getPriorityColor(report.priority) as any}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={report.status}
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {report.category} • {report.createdAt instanceof Date ? report.createdAt.toLocaleDateString('en-GB') : ''}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mt: 1,
                        p: 2,
                        backgroundColor: 'grey.50',
                        borderRadius: 2,
                        borderLeft: 4,
                        borderLeftColor: `${getPriorityColor(report.priority)}.main`
                      }}
                    >
                      {report.description && report.description.length > 100 
                        ? report.description.substring(0, 100) + '...'
                        : report.description || 'No description available'
                      }
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < displayReports.length - 1 && (
              <Divider sx={{ my: 1, opacity: 0.6 }} />
            )}
          </Box>
        ))}
      </List>
    </Box>
  );
};

export default ReportList;
