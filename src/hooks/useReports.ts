import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, Timestamp, startAt, endAt } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Report, Feedback, DashboardMetrics, Installation, ProductFailure, DashboardFilters } from '../types';

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'Reports'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reportsData: Report[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          reportsData.push({
            id: doc.id,
            hospitalName: data.hospitalName || data.customerDetails?.hospitalName || 'Unknown Hospital',
            priority: data.priority || 'normal',
            createdAt: (
              data.createdAt && typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate()
                : (typeof data.createdAt === 'string' || typeof data.createdAt === 'number'
                    ? new Date(data.createdAt)
                    : new Date())
            ),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            description: data.description || '',
            status: data.status,
            assignedTo: data.assignedTo,
            category: data.category,
            feedback: data.feedback || '',
            customerDetails: data.customerDetails,
            products: data.products || [],
          });
        });
        
        const priorityOrder = { critical: 3, pending: 2, normal: 1 };
        const sortedReports = reportsData.sort((a, b) => {
          const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                              (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
          if (priorityDiff !== 0) return priorityDiff;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        
        setReports(sortedReports);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching reports:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { reports, loading, error };
};

export const useFeedback = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'feedback'),
      orderBy('priority'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const feedbackData: Feedback[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          feedbackData.push({
            id: doc.id,
            hospitalName: data.hospitalName,
            priority: data.priority,
            message: data.message,
            createdAt: (
              data.createdAt && typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate()
                : (typeof data.createdAt === 'string' || typeof data.createdAt === 'number'
                    ? new Date(data.createdAt)
                    : new Date())
            ),
            reportId: data.reportId
          });
        });
        setFeedback(feedbackData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching feedback:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { feedback, loading, error };
};

export const useInstallations = (filters?: DashboardFilters) => {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let q = query(collection(db, 'installations'), orderBy('installationDate', 'desc'));

    // Apply filters if provided
    if (filters) {
      if (filters.dateRange) {
        q = query(q, 
          startAt(Timestamp.fromDate(filters.dateRange.start)),
          endAt(Timestamp.fromDate(filters.dateRange.end))
        );
      }
      if (filters.region) {
        q = query(q, where('region', '==', filters.region));
      }
      if (filters.productCategory) {
        q = query(q, where('productCategory', '==', filters.productCategory));
      }
      if (filters.engineerId) {
        q = query(q, where('engineerId', '==', filters.engineerId));
      }
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const installationsData: Installation[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          installationsData.push({
            id: doc.id,
            hospitalName: data.hospitalName,
            productName: data.productName,
            productModel: data.productModel,
            region: data.region,
            state: data.state,
            installationDate: (
              data.installationDate && typeof data.installationDate.toDate === 'function'
                ? data.installationDate.toDate()
                : (typeof data.installationDate === 'string' || typeof data.installationDate === 'number'
                    ? new Date(data.installationDate)
                    : new Date())
            ),
            engineerId: data.engineerId,
            engineerName: data.engineerName,
            status: data.status,
            productsPerOrder: data.productsPerOrder || 1,
            revenue: data.revenue || 0,
            failureReported: data.failureReported || false,
            failureDate: data.failureDate?.toDate(),
            failureReason: data.failureReason
          });
        });
        setInstallations(installationsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching installations:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filters]);

  return { installations, loading, error };
};

export const useProductFailures = () => {
  const [failures, setFailures] = useState<ProductFailure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'productFailures'),
      orderBy('failureRate', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const failuresData: ProductFailure[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          failuresData.push({
            id: doc.id,
            productName: data.productName,
            productModel: data.productModel,
            failureCount: data.failureCount || 0,
            totalInstallations: data.totalInstallations || 0,
            failureRate: data.failureRate || 0,
            lastFailureDate: data.lastFailureDate?.toDate() || new Date(),
            commonIssues: data.commonIssues || []
          });
        });
        setFailures(failuresData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching product failures:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { failures, loading, error };
};

export const useDashboardMetrics = (reports: Report[]): DashboardMetrics => {
  return {
    totalReports: reports.length,
    criticalReports: reports.filter(r => r.priority === 'critical').length,
    pendingReports: reports.filter(r => r.priority === 'pending').length,
    resolvedReports: reports.filter(r => r.status === 'resolved').length
  };
};

export const useInstallationMetrics = (installations: Installation[]) => {
  const totalInstallations = installations.length;
  const completedInstallations = installations.filter(i => i.status === 'completed').length;
  const failedInstallations = installations.filter(i => i.status === 'failed').length;
  const totalRevenue = installations.reduce((sum, i) => sum + i.revenue, 0);
  const avgProductsPerOrder = installations.length > 0 
    ? installations.reduce((sum, i) => sum + i.productsPerOrder, 0) / installations.length 
    : 0;
  const repeatInstallations = installations.filter(i => i.failureReported).length;

  // Monthly installations for the last 12 months
  const monthlyInstallations = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleString('default', { month: 'short' });
    const count = installations.filter(inst => {
      const instDate = new Date(inst.installationDate);
      return instDate.getMonth() === date.getMonth() && 
             instDate.getFullYear() === date.getFullYear();
    }).length;
    return { month, installations: count };
  }).reverse();

  // Product-wise data
  const productWiseData = installations.reduce((acc, inst) => {
    const existing = acc.find(p => p.product === inst.productName);
    if (existing) {
      existing.count++;
      existing.revenue += inst.revenue;
    } else {
      acc.push({ product: inst.productName, count: 1, revenue: inst.revenue });
    }
    return acc;
  }, [] as { product: string; count: number; revenue: number }[]);

  // Regional data
  const regionalData = installations.reduce((acc, inst) => {
    const existing = acc.find(r => r.region === inst.region);
    if (existing) {
      existing.installations++;
    } else {
      acc.push({ region: inst.region, installations: 1 });
    }
    return acc;
  }, [] as { region: string; installations: number }[]);

  return {
    totalInstallations,
    completedInstallations,
    failedInstallations,
    totalRevenue,
    avgProductsPerOrder,
    repeatInstallations,
    monthlyInstallations,
    productWiseData,
    regionalData
  };
};

// Installation trend: reports per month
export const useInstallationTrend = (reports: Report[]) => {
  const trend = reports.reduce((acc, report) => {
    const date = report.createdAt;
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  // Convert to sorted array
  return Object.entries(trend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
};

// Model distribution: companyOfOrigin from products
export const useModelDistribution = (reports: Report[]) => {
  const companyCounts: Record<string, number> = {};
  reports.forEach(report => {
    (report.products || []).forEach(product => {
      const company = product.companyOfOrigin || 'Unknown';
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });
  });
  return Object.entries(companyCounts).map(([company, count]) => ({ company, count }));
};

// Product-wise installation: product name counts with quantity
export const useProductWiseInstallation = (reports: Report[]) => {
  const productCounts: Record<string, number> = {};
  reports.forEach(report => {
    (report.products || []).forEach(product => {
      const name = product.name || 'Unknown';
      const quantity = product.quantity || 1;
      productCounts[name] = (productCounts[name] || 0) + quantity;
    });
  });
  // For line chart, return sorted by name
  return Object.entries(productCounts).sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count }));
};

// Regional performance: location counts
export const useRegionalPerformance = (reports: Report[]) => {
  const regionCounts: Record<string, number> = {};
  reports.forEach(report => {
    const location = report.customerDetails?.location || 'Unknown';
    regionCounts[location] = (regionCounts[location] || 0) + 1;
  });
  return Object.entries(regionCounts).map(([location, count]) => ({ location, count }));
};
