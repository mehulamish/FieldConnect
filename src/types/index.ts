export interface Report {
  id: string;
  hospitalName: string;
  priority: 'critical' | 'pending' | 'normal' | 'Critical' | 'Pending' | 'Normal';
  createdAt: Date;
  updatedAt: Date;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'Open' | 'In-Progress' | 'Resolved' | 'Pending';
  assignedTo?: string;
  category: string;
  feedback?: string;
  createdBy?: string;
  lat?: number;
  lng?: number;
  customerDetails?: {
    address: string;
    branch: string;
    department: string;
    designation: string;
    email: string;
    hospitalName: string;
    location: string;
    name: string;
    phone: string;
    poOrderNo: string;
    lat?: number;
    lng?: number;
  };
  customerSignature?: string;
  engineerSignature?: string;
  pdfUrl?: string;
  products?: Array<{
    companyOfOrigin: string;
    id: string;
    model: string;
    name: string;
    pId: string;
    quantity: number;
    serialNo: string;
    size: string;
    specification: string;
  }>;
  reportId?: string;
  stamp?: string;
  syncedAt?: Date;
  timestamp?: string;
}

export interface Feedback {
  id: string;
  hospitalName: string;
  priority: 'critical' | 'pending' | 'positive';
  message: string;
  createdAt: Date;
  reportId?: string;
}

export interface DashboardMetrics {
  totalReports: number;
  criticalReports: number;
  pendingReports: number;
  resolvedReports: number;
}

export interface Installation {
  id: string;
  hospitalName: string;
  productName: string;
  productModel: string;
  region: string;
  state: string;
  installationDate: Date;
  engineerId: string;
  engineerName: string;
  status: 'completed' | 'in-progress' | 'failed';
  productsPerOrder: number;
  revenue: number;
  failureReported?: boolean;
  failureDate?: Date;
  failureReason?: string;
}

export interface ProductFailure {
  id: string;
  productName: string;
  productModel: string;
  failureCount: number;
  totalInstallations: number;
  failureRate: number;
  lastFailureDate: Date;
  commonIssues: string[];
}

export interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  region: string;
  productCategory: string;
  engineerId?: string;
}
