import api from '@/lib/api';
import type {
  ApiResponse,
  PageResponse,
  User,
  Loan,
  KycProfile,
  Transaction,
  Ticket,
  DashboardStats,
  UserRole,
  UserStatus,
  LoanStatus,
  LoanPurpose,
  KycStatus,
  TicketStatus,
  TicketPriority,
  TransactionStatus,
  LoanReviewRequest,
} from '@/types';

export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  size?: number;
}

export interface AdminLoanFilters {
  search?: string;
  status?: LoanStatus;
  purpose?: LoanPurpose;
  page?: number;
  size?: number;
}

export interface KycFilters {
  status?: KycStatus;
  page?: number;
  size?: number;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
  page?: number;
  size?: number;
}

export interface WithdrawalFilters {
  status?: TransactionStatus;
  page?: number;
  size?: number;
}



export interface KycReviewRequest {
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
}

export const adminService = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
    return response.data.data;
  },

  // Users
  async getUsers(filters?: UserFilters): Promise<PageResponse<User>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<User>>>(`/admin/users?${params}`);
    return response.data.data;
  },

  async getUserById(id: number): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/admin/users/${id}`);
    return response.data.data;
  },

  async updateUserStatus(id: number, status: UserStatus): Promise<void> {
    await api.put(`/admin/users/${id}/status`, { status });
  },

  async banUser(id: number, reason: string): Promise<void> {
    await api.post(`/admin/users/${id}/ban`, { reason });
  },

  async unbanUser(id: number): Promise<void> {
    await api.post(`/admin/users/${id}/unban`);
  },

  // Loans
  async getLoans(filters?: AdminLoanFilters): Promise<PageResponse<Loan>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.purpose) params.append('purpose', filters.purpose);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<Loan>>>(`/admin/loans?${params}`);
    return response.data.data;
  },

  async getLoanById(id: number): Promise<Loan> {
    const response = await api.get<ApiResponse<Loan>>(`/admin/loans/${id}`);
    return response.data.data;
  },

  async reviewLoan(id: number, data: LoanReviewRequest): Promise<Loan> {
    const response = await api.post<ApiResponse<Loan>>(`/admin/loans/${id}/review`, data);
    return response.data.data;
  },

  // KYC
  async getKycProfiles(filters?: KycFilters): Promise<PageResponse<KycProfile>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<KycProfile>>>(`/admin/kyc?${params}`);
    return response.data.data;
  },

  async getKycProfileById(id: number): Promise<KycProfile> {
    const response = await api.get<ApiResponse<KycProfile>>(`/admin/kyc/${id}`);
    return response.data.data;
  },

  async reviewKyc(id: number, data: KycReviewRequest): Promise<KycProfile> {
    const response = await api.post<ApiResponse<KycProfile>>(`/admin/kyc/${id}/review`, data);
    return response.data.data;
  },

  // Withdrawals
  async getWithdrawals(filters?: WithdrawalFilters): Promise<PageResponse<Transaction>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<Transaction>>>(`/admin/withdrawals?${params}`);
    return response.data.data;
  },

  async approveWithdrawal(transactionId: number): Promise<void> {
    await api.post(`/admin/withdrawals/${transactionId}/approve`);
  },

  async rejectWithdrawal(transactionId: number, reason: string): Promise<void> {
    await api.post(`/admin/withdrawals/${transactionId}/reject?reason=${encodeURIComponent(reason)}`);
  },

  // Tickets
  async getTickets(filters?: TicketFilters): Promise<PageResponse<Ticket>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<Ticket>>>(`/tickets/admin?${params}`);
    return response.data.data;
  },

  async getTicketById(id: number): Promise<Ticket> {
    const response = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return response.data.data;
  },

  async updateTicketStatus(id: number, status: TicketStatus): Promise<void> {
    await api.put(`/tickets/admin/${id}/status?status=${status}`);
  },

  async updateTicketPriority(id: number, priority: TicketPriority): Promise<void> {
    await api.put(`/tickets/admin/${id}/priority?priority=${priority}`);
  },

  async assignTicket(id: number, staffId: number): Promise<void> {
    await api.put(`/tickets/admin/${id}/assign?staffId=${staffId}`);
  },

};

export default adminService;

