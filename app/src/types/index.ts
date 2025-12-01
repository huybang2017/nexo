// ==========================================
// Common Types
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
  requestId?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ==========================================
// Enums
// ==========================================

export type UserRole = 'ADMIN' | 'BORROWER' | 'LENDER';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';
export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type KycDocumentType = 'ID_CARD_FRONT' | 'ID_CARD_BACK' | 'SELFIE' | 'BANK_STATEMENT' | 'INCOME_PROOF' | 'BUSINESS_LICENSE';

export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'INVESTMENT' | 'INVESTMENT_RETURN' | 'REPAYMENT_RECEIVED' | 'REPAYMENT_PAID' | 'LOAN_DISBURSEMENT' | 'FEE' | 'REFUND';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type LoanStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'FUNDING' | 'FUNDED' | 'ACTIVE' | 'REPAYING' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED';
export type LoanPurpose = 'PERSONAL' | 'BUSINESS' | 'EDUCATION' | 'MEDICAL' | 'HOME_IMPROVEMENT' | 'DEBT_CONSOLIDATION' | 'STARTUP' | 'OTHER';

export type InvestmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type RepaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'DEFAULTED';

export type PaymentProvider = 'VNPAY' | 'MOMO' | 'STRIPE' | 'BANK_TRANSFER' | 'INTERNAL';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationType = 'SYSTEM' | 'LOAN' | 'INVESTMENT' | 'PAYMENT' | 'KYC' | 'SECURITY';

// ==========================================
// User Types
// ==========================================

export interface User {
  id: number;
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  role: UserRole;
  status: UserStatus;
  kycStatus: KycStatus;
  emailVerified: boolean;
  creditScore: number;
  oauthProvider?: string;
  lastLoginAt?: string;
  createdAt: string;
}

// ==========================================
// Auth Types
// ==========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ==========================================
// Wallet Types
// ==========================================

export interface Wallet {
  id: number;
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  currency: string;
  isActive: boolean;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  referenceCode: string;
  type: TransactionType;
  status: TransactionStatus;
  userId?: number;
  userName?: string;
  userEmail?: string;
  amount: number;
  fee: number;
  netAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  description?: string;
  loanId?: number;
  loanCode?: string;
  investmentId?: number;
  investmentCode?: string;
  createdAt: string;
}

export interface DepositRequest {
  amount: number;
  provider: PaymentProvider;
  bankCode?: string;
  returnUrl?: string;
}

export interface WithdrawRequest {
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  bankBranch?: string;
  note?: string;
}

export interface PaymentUrlResponse {
  paymentCode: string;
  paymentUrl: string;
  amount: number;
  expiresAt: string;
}

// ==========================================
// Loan Types
// ==========================================

export interface Loan {
  id: number;
  loanCode: string;
  title: string;
  description?: string;
  purpose: LoanPurpose;
  requestedAmount: number;
  fundedAmount: number;
  remainingAmount: number;
  fundingProgress: number;
  interestRate: number;
  platformFeeRate: number;
  termMonths: number;
  riskGrade: string;
  creditScoreAtRequest?: number;
  status: LoanStatus;
  fundingDeadline?: string;
  disbursedAt?: string;
  maturityDate?: string;
  totalRepaid: number;
  totalInterestPaid: number;
  investorCount: number;
  borrowerId: number;
  borrowerName: string;
  borrowerCreditScore?: number;
  nextRepaymentDate?: string;
  nextRepaymentAmount?: number;
  rejectionReason?: string;
  documents?: LoanDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface LoanDocument {
  id: number;
  loanId: number;
  documentType: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  mimeType?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoanRequest {
  title: string;
  description?: string;
  purpose: LoanPurpose;
  amount: number;
  termMonths: number;
}

export interface LoanReviewRequest {
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
  adjustedInterestRate?: number;
  note?: string;
}

// ==========================================
// Investment Types
// ==========================================

export interface Investment {
  id: number;
  investmentCode: string;
  loanId: number;
  loanCode: string;
  loanTitle: string;
  amount: number;
  interestRate: number;
  status: InvestmentStatus;
  expectedReturn: number;
  actualReturn: number;
  returnProgress: number;
  investedAt: string;
  maturityDate?: string;
  loanStatus: string;
  borrowerCreditScore?: number;
  nextReturnDate?: string;
  nextReturnAmount?: number;
  createdAt: string;
}

export interface InvestRequest {
  loanId: number;
  amount: number;
}

export interface Portfolio {
  totalInvested: number;
  totalActiveInvestments: number;
  totalCompletedInvestments: number;
  totalExpectedReturn: number;
  totalActualReturn: number;
  averageInterestRate: number;
  portfolioHealth: string;
  riskDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
}

export interface AuditLog {
  id: number;
  userId?: number;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: number;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  createdAt: string;
}

export interface SystemSetting {
  id: number;
  settingKey: string;
  settingValue: string;
  settingType: string;
  description?: string;
  category?: string;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// KYC Types
// ==========================================

export interface KycProfile {
  id: number;
  status: KycStatus;
  idCardNumber?: string;
  idCardIssuedDate?: string;
  idCardIssuedPlace?: string;
  idCardExpiryDate?: string;
  fullName?: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  occupation?: string;
  employerName?: string;
  monthlyIncome?: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankBranch?: string;
  documents: KycDocument[];
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  submittedAt?: string;
  createdAt: string;
}

export interface KycDocument {
  id: number;
  documentType: KycDocumentType;
  fileName: string;
  fileUrl?: string;
  fileSize: number;
  verified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

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

// ==========================================
// Repayment Types
// ==========================================

export interface RepaymentSchedule {
  id: number;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingPrincipal: number;
  status: RepaymentStatus;
  paidAmount?: number;
  paidAt?: string;
  lateFee?: number;
}

export interface Repayment {
  id: number;
  repaymentCode: string;
  scheduleId: number;
  loanId: number;
  status: RepaymentStatus;
  dueAmount: number;
  paidAmount: number;
  lateFee: number;
  dueDate: string;
  paidAt?: string;
  daysOverdue: number;
  createdAt: string;
}

// ==========================================
// Notification Types
// ==========================================

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ==========================================
// Ticket Types
// ==========================================

export interface Ticket {
  id: number;
  ticketCode: string;
  subject: string;
  category?: string;
  status: TicketStatus;
  priority: TicketPriority;
  userId: number;
  user?: User;
  assignedToId?: number;
  assignedTo?: User;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  relatedLoanId?: number;
  relatedTransactionId?: number;
}

export interface TicketMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderRole: UserRole;
  message: string;
  isInternal: boolean;
  attachmentPath?: string;
  attachmentName?: string;
  createdAt: string;
}

export interface CreateTicketRequest {
  subject: string;
  category?: string;
  message: string;
  relatedLoanId?: number;
  relatedTransactionId?: number;
}

// ==========================================
// Admin Types
// ==========================================

export interface DashboardStats {
  users: {
    total: number;
    borrowers: number;
    lenders: number;
    active: number;
  };
  kyc: {
    pending: number;
    approved: number;
    rejected: number;
  };
  loans: {
    pending: number;
    funding: number;
    active: number;
    completed: number;
    totalVolume: number;
  };
  support: {
    openTickets: number;
    inProgress: number;
  };
}

// ==========================================
// Credit Score Types
// ==========================================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL';
export type CreditScoreEventType = 
  | 'INITIAL_SCORE'
  | 'KYC_VERIFIED'
  | 'REPAYMENT_ON_TIME'
  | 'REPAYMENT_EARLY'
  | 'LOAN_COMPLETED'
  | 'INCOME_VERIFIED'
  | 'EMPLOYMENT_VERIFIED'
  | 'BANK_ACCOUNT_LINKED'
  | 'PROFILE_COMPLETED'
  | 'LONG_TERM_MEMBER'
  | 'REPAYMENT_LATE_1_7_DAYS'
  | 'REPAYMENT_LATE_8_14_DAYS'
  | 'REPAYMENT_LATE_15_30_DAYS'
  | 'REPAYMENT_LATE_OVER_30_DAYS'
  | 'LOAN_DEFAULTED'
  | 'FRAUD_DETECTED'
  | 'KYC_REJECTED'
  | 'LOAN_REJECTED'
  | 'ACCOUNT_WARNING'
  | 'SCORE_RECALCULATED'
  | 'MANUAL_ADJUSTMENT';

export interface CreditScoreComponents {
  paymentHistoryScore: number;
  paymentHistoryWeight: number;
  creditUtilizationScore: number;
  creditUtilizationWeight: number;
  creditHistoryLengthScore: number;
  creditHistoryLengthWeight: number;
  identityVerificationScore: number;
  identityVerificationWeight: number;
  incomeStabilityScore: number;
  incomeStabilityWeight: number;
  behaviorScore: number;
  behaviorWeight: number;
}

export interface CreditScoreStats {
  totalLoansCompleted: number;
  totalLoansDefaulted: number;
  totalOnTimePayments: number;
  totalLatePayments: number;
  averageDaysLate: number;
  totalAmountBorrowed: number;
  totalAmountRepaid: number;
  repaymentRate: number;
  onTimePaymentRate: number;
}

export interface CreditScore {
  id: number;
  userId: number;
  totalScore: number;
  maxScore: number;
  components: CreditScoreComponents;
  riskLevel: RiskLevel;
  riskGrade: string;
  riskDescription: string;
  isEligibleForLoan: boolean;
  eligibilityReason: string;
  maxLoanAmount: number;
  minInterestRate: number;
  maxInterestRate: number;
  statistics: CreditScoreStats;
  lastCalculatedAt: string;
  nextReviewAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditScoreSummary {
  totalScore: number;
  maxScore: number;
  riskLevel: RiskLevel;
  riskGrade: string;
  isEligibleForLoan: boolean;
  maxLoanAmount: number;
  scoreChange30Days: number;
  recentEventsCount: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface CreditScoreHistory {
  id: number;
  userId: number;
  eventType: CreditScoreEventType;
  eventDescription: string;
  scoreBefore: number;
  scoreAfter: number;
  scoreChange: number;
  description: string;
  relatedLoanId?: number;
  relatedRepaymentId?: number;
  createdAt: string;
}

export interface AdminAdjustScoreRequest {
  adjustment: number;
  reason: string;
  metadata?: string;
}

// ============== KYC SCORING TYPES ==============

export type KycRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'FRAUD';

export type KycFraudType =
  | 'DOCUMENT_DUPLICATE'
  | 'DOCUMENT_TAMPERING'
  | 'DOCUMENT_EXPIRED'
  | 'DOCUMENT_LOW_QUALITY'
  | 'DOCUMENT_BLURRY'
  | 'DOCUMENT_OCR_MISMATCH'
  | 'ID_CARD_DUPLICATE'
  | 'ID_CARD_INVALID_FORMAT'
  | 'ID_CARD_EXPIRED'
  | 'FACE_MISMATCH'
  | 'FACE_LOW_CONFIDENCE'
  | 'FACE_MULTIPLE_DETECTED'
  | 'PROFILE_UNDERAGE'
  | 'PROFILE_SUSPICIOUS_EMAIL'
  | 'PROFILE_SUSPICIOUS_PHONE'
  | 'PROFILE_KNOWN_FRAUD_DB'
  | 'PROFILE_IP_BLACKLISTED'
  | 'PROFILE_VPN_DETECTED'
  | 'PROFILE_DEVICE_FRAUD'
  | 'BEHAVIOR_RAPID_SUBMISSION'
  | 'BEHAVIOR_COPY_PASTE_DETECTED'
  | 'BEHAVIOR_MULTIPLE_ATTEMPTS'
  | 'CROSS_CHECK_BANK_MISMATCH'
  | 'CROSS_CHECK_ADDRESS_MISMATCH';

export interface KycFraudFlag {
  id: number;
  fraudType: KycFraudType;
  description: string;
  scorePenalty: number;
  isCritical: boolean;
  isResolved: boolean;
  confidenceScore: number;
  createdAt: string;
}

export interface KycDocumentScoreBreakdown {
  imageQualityScore: number;
  ocrAccuracyScore: number;
  blurDetectionScore: number;
  tamperingDetectionScore: number;
  faceQualityScore: number;
  dataConsistencyScore: number;
  expirationCheckScore: number;
  ocrConfidence: number;
  faceMatchScore: number;
}

export interface KycProfileScoreBreakdown {
  ageVerificationScore: number;
  phoneTrustScore: number;
  emailTrustScore: number;
  ipReputationScore: number;
  deviceTrustScore: number;
  behaviorScore: number;
  dataCompletenessScore: number;
  incomeVerificationScore: number;
}

export interface KycScore {
  userId: number;
  kycProfileId: number;
  documentScore: number;
  profileScore: number;
  riskScore: number;
  totalScore: number;
  riskLevel: KycRiskLevel;
  riskDescription: string;
  recommendedDecision: string;
  fraudFlagsCount: number;
  criticalFlagsCount: number;
  fraudPenalty: number;
  fraudFlags: KycFraudFlag[];
  explanations: string[];
  documentScoreBreakdown?: KycDocumentScoreBreakdown;
  profileScoreBreakdown?: KycProfileScoreBreakdown;
  scoredAt: string;
  lastRecalculatedAt: string;
}

export interface KycScoreSummary {
  userId: number;
  totalScore: number;
  maxScore: number;
  riskLevel: KycRiskLevel;
  recommendedDecision: string;
  fraudFlagsCount: number;
  hasCriticalFlags: boolean;
  scoreGrade: string;
}

export interface KycDocumentScore {
  documentId: number;
  documentType: string;
  fileName: string;
  totalScore: number;
  imageQualityScore: number;
  ocrAccuracyScore: number;
  blurDetectionScore: number;
  tamperingDetectionScore: number;
  faceQualityScore: number;
  dataConsistencyScore: number;
  expirationCheckScore: number;
  ocrConfidence: number;
  faceMatchScore: number;
  faceMatchConfidence: number;
  aiExplanations: string[];
  processingTimeMs: number;
  isDuplicate: boolean;
  duplicateMatchedProfileId?: number;
}

export interface DuplicateMatch {
  matchedProfileId: number;
  matchedDocumentId?: number;
  matchedUserId: number;
  matchedUserEmail: string;
  matchType: string;
  similarityScore: number;
  matchedDocumentCreatedAt: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateType?: string;
  matches: DuplicateMatch[];
  recommendation: string;
}

