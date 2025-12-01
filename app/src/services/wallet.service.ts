import api from '@/lib/api';
import type {
  ApiResponse,
  PageResponse,
  Wallet,
  Transaction,
  DepositRequest,
  WithdrawRequest,
  PaymentUrlResponse,
  TransactionType,
  TransactionStatus,
} from '@/types';

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export const walletService = {
  async getWallet(): Promise<Wallet> {
    const response = await api.get<ApiResponse<Wallet>>('/wallet');
    return response.data.data;
  },

  async getTransactions(filters?: TransactionFilters): Promise<PageResponse<Transaction>> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.page !== undefined) params.append('page', String(filters.page));
    if (filters?.size !== undefined) params.append('size', String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<Transaction>>>(`/wallet/transactions?${params}`);
    return response.data.data;
  },

  async getTransactionById(id: number): Promise<Transaction> {
    const response = await api.get<ApiResponse<Transaction>>(`/wallet/transactions/${id}`);
    return response.data.data;
  },

  async requestDeposit(data: DepositRequest): Promise<PaymentUrlResponse> {
    const response = await api.post<ApiResponse<PaymentUrlResponse>>('/wallet/deposit', data);
    return response.data.data;
  },

  async requestWithdraw(data: WithdrawRequest): Promise<Transaction> {
    const response = await api.post<ApiResponse<Transaction>>('/wallet/withdraw', data);
    return response.data.data;
  },
};

export default walletService;

