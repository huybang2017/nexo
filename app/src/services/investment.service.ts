import api from "@/lib/api";
import type {
  ApiResponse,
  PageResponse,
  Investment,
  InvestRequest,
  Portfolio,
  InvestmentStatus,
} from "@/types";

export interface InvestmentFilters {
  status?: InvestmentStatus;
  page?: number;
  size?: number;
}

export const investmentService = {
  async createInvestment(data: InvestRequest): Promise<Investment> {
    const response = await api.post<ApiResponse<Investment>>(
      "/investments",
      data
    );
    return response.data.data;
  },

  async getMyInvestments(
    filters?: InvestmentFilters
  ): Promise<PageResponse<Investment>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.page !== undefined)
      params.append("page", String(filters.page));
    if (filters?.size !== undefined)
      params.append("size", String(filters.size));

    const response = await api.get<ApiResponse<PageResponse<Investment>>>(
      `/investments/my?${params}`
    );
    return response.data.data;
  },

  async getInvestmentById(id: number): Promise<Investment> {
    const response = await api.get<ApiResponse<Investment>>(
      `/investments/${id}`
    );
    return response.data.data;
  },

  async getPortfolio(): Promise<Portfolio> {
    const response = await api.get<ApiResponse<Portfolio>>(
      "/investments/portfolio"
    );
    return response.data.data;
  },
};

export default investmentService;
