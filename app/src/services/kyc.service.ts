import api from "@/lib/api";

export interface KycSubmitRequest {
  idCardNumber: string;
  idCardIssuedDate: string;
  idCardIssuedPlace: string;
  idCardExpiryDate?: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  nationality?: string;
  address: string;
  city: string;
  district?: string;
  ward?: string;
  occupation?: string;
  employerName?: string;
  monthlyIncome?: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  bankBranch?: string;
}

export interface KycProfileResponse {
  id: number;
  userId: number;
  status: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  personalInfo: any;
  idCardInfo: any;
  addressInfo: any;
  employmentInfo: any;
  bankInfo: any;
  documents: Array<{
    id: number;
    documentType: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
  }>;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: number;
  rejectionReason?: string;
}

export interface KycDocumentResponse {
  id: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
}

export const kycService = {
  async getMyKyc(): Promise<KycProfileResponse> {
    const response = await api.get("/kyc/me");
    return response.data.data;
  },

  async submitKyc(data: KycSubmitRequest): Promise<KycProfileResponse> {
    const response = await api.post("/kyc/submit", data);
    return response.data.data;
  },

  async uploadDocument(
    file: File,
    documentType: "ID_CARD_FRONT" | "ID_CARD_BACK" | "SELFIE"
  ): Promise<KycDocumentResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const response = await api.post("/kyc/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },
};
