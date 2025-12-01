import api from '@/lib/api';
import type {
  ApiResponse,
  PageResponse,
  Loan,
  LoanDocument,
  CreateLoanRequest,
  LoanReviewRequest,
  LoanStatus,
  LoanPurpose,
  RepaymentSchedule,
} from '@/types';

export interface LoanFilters {
  status?: LoanStatus;
  page?: number;
  size?: number;
}

export interface MarketplaceFilters {
  search?: string;
  purpose?: LoanPurpose;
  riskGrades?: string[];
  minRate?: number;
  maxRate?: number;
  minAmount?: number;
  maxAmount?: number;
  minTerm?: number;
  maxTerm?: number;
  page?: number;
  size?: number;
}

export const loanService = {
  // Borrower endpoints
  async createLoan(data: CreateLoanRequest): Promise<Loan> {
    const response = await api.post<ApiResponse<Loan>>('/loans', data);
    return response.data.data;
  },

  async getMyLoans(filters?: LoanFilters): Promise<PageResponse<Loan>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<Loan>>>(`/loans/my?${params}`);
    return response.data.data;
  },

  async getLoanById(id: number): Promise<Loan> {
    const response = await api.get<ApiResponse<Loan>>(`/loans/${id}`);
    return response.data.data;
  },

  async getLoanByCode(code: string): Promise<Loan> {
    const response = await api.get<ApiResponse<Loan>>(`/loans/code/${code}`);
    return response.data.data;
  },

  async cancelLoan(id: number): Promise<void> {
    await api.post(`/loans/${id}/cancel`);
  },

  async getRepaymentSchedule(loanId: number): Promise<RepaymentSchedule[]> {
    const response = await api.get<ApiResponse<RepaymentSchedule[]>>(`/repayments/loan/${loanId}/schedule`);
    return response.data.data;
  },

  // Marketplace endpoints (for lenders)
  async getMarketplaceLoans(filters?: MarketplaceFilters): Promise<PageResponse<Loan>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.purpose) params.append('purpose', filters.purpose);
    if (filters?.riskGrades?.length) params.append('riskGrades', filters.riskGrades.join(','));
    if (filters?.minRate !== undefined) params.append('minRate', String(filters.minRate));
    if (filters?.maxRate !== undefined) params.append('maxRate', String(filters.maxRate));
    if (filters?.minAmount !== undefined) params.append('minAmount', String(filters.minAmount));
    if (filters?.maxAmount !== undefined) params.append('maxAmount', String(filters.maxAmount));
    if (filters?.minTerm !== undefined) params.append('minTerm', String(filters.minTerm));
    if (filters?.maxTerm !== undefined) params.append('maxTerm', String(filters.maxTerm));
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<Loan>>>(`/marketplace/loans?${params}`);
    return response.data.data;
  },

  async getMarketplaceLoanDetail(id: number): Promise<Loan> {
    const response = await api.get<ApiResponse<Loan>>(`/marketplace/loans/${id}`);
    return response.data.data;
  },

  // Loan Documents
  async getLoanDocuments(loanId: number): Promise<LoanDocument[]> {
    const response = await api.get<ApiResponse<LoanDocument[]>>(`/loans/${loanId}/documents`);
    return response.data.data;
  },

  async uploadLoanDocument(
    loanId: number,
    file: File,
    documentType: string,
    description?: string
  ): Promise<LoanDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (description) formData.append('description', description);

    const response = await api.post<ApiResponse<LoanDocument>>(
      `/loans/${loanId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  async deleteLoanDocument(documentId: number): Promise<void> {
    await api.delete(`/loans/documents/${documentId}`);
  },

  async getLoanInvestments(loanId: number): Promise<any[]> {
    const response = await api.get<ApiResponse<any[]>>(`/loans/${loanId}/investments`);
    return response.data.data;
  },

  // Admin endpoints
  async reviewLoan(id: number, data: LoanReviewRequest): Promise<Loan> {
    const response = await api.post<ApiResponse<Loan>>(`/admin/loans/${id}/review`, data);
    return response.data.data;
  },
};

export default loanService;

