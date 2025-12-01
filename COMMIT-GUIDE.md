# 📋 HƯỚNG DẪN COMMIT THEO CHỨC NĂNG

## 🎯 COMMIT 1: Credit Score System - Backend

```bash
git add server/src/main/java/com/nexo/server/enums/CreditScoreEventType.java
git add server/src/main/java/com/nexo/server/enums/RiskLevel.java
git add server/src/main/java/com/nexo/server/entities/CreditScore.java
git add server/src/main/java/com/nexo/server/entities/CreditScoreHistory.java
git add server/src/main/java/com/nexo/server/repositories/CreditScoreRepository.java
git add server/src/main/java/com/nexo/server/repositories/CreditScoreHistoryRepository.java
git add server/src/main/java/com/nexo/server/dto/creditscore/*.java
git add server/src/main/java/com/nexo/server/services/CreditScoreService.java
git add server/src/main/java/com/nexo/server/controllers/CreditScoreController.java
git add server/src/main/java/com/nexo/server/config/SecurityConfig.java
git add server/src/main/resources/application.yml

# Commit các service integrations
git add server/src/main/java/com/nexo/server/services/LoanService.java
git add server/src/main/java/com/nexo/server/services/KycService.java
git add server/src/main/java/com/nexo/server/services/RepaymentService.java
git add server/src/main/java/com/nexo/server/repositories/LoanRepository.java
git add server/src/main/java/com/nexo/server/repositories/RepaymentRepository.java

git commit -m "feat(backend): implement Credit Score system

- Add CreditScore and CreditScoreHistory entities
- Implement CreditScoreService with scoring algorithm
- Add event-based score updates (loan, repayment, KYC)
- Calculate risk levels and loan eligibility
- Integrate with LoanService, KycService, RepaymentService
- Add REST API endpoints for credit score queries
- Support admin score adjustments"
```

## 🎯 COMMIT 2: Credit Score System - Frontend

```bash
git add app/src/types/index.ts
git add app/src/services/creditScore.service.ts
git add app/src/hooks/useCreditScore.ts
git add app/src/components/credit-score/*.tsx
git add app/src/pages/borrower/CreditScorePage.tsx
git add app/src/pages/borrower/BorrowerDashboard.tsx
git add app/src/components/ui/accordion.tsx
git add app/src/router/index.tsx
git add app/src/components/layouts/DashboardLayout.tsx
git add app/src/services/index.ts
git add app/src/hooks/index.ts

git commit -m "feat(frontend): implement Credit Score UI components

- Add CreditScoreCard, CreditScoreGauge, RiskLevelBadge components
- Implement CreditScoreHistoryTable for score history
- Create dedicated CreditScorePage for borrowers
- Add credit score widget to BorrowerDashboard
- Integrate with credit score API endpoints
- Add React Query hooks for data fetching
- Support real-time score updates"
```

## 🎯 COMMIT 3: KYC Scoring Engine - Backend Core

```bash
git add server/src/main/java/com/nexo/server/enums/KycRiskLevel.java
git add server/src/main/java/com/nexo/server/enums/KycFraudType.java
git add server/src/main/java/com/nexo/server/enums/KycVerificationStatus.java
git add server/src/main/java/com/nexo/server/entities/KycDocumentScore.java
git add server/src/main/java/com/nexo/server/entities/KycProfileScore.java
git add server/src/main/java/com/nexo/server/entities/KycFraudFlag.java
git add server/src/main/java/com/nexo/server/entities/KycDocument.java
git add server/src/main/java/com/nexo/server/repositories/KycDocumentScoreRepository.java
git add server/src/main/java/com/nexo/server/repositories/KycProfileScoreRepository.java
git add server/src/main/java/com/nexo/server/repositories/KycFraudFlagRepository.java
git add server/src/main/java/com/nexo/server/repositories/KycDocumentRepository.java
git add server/src/main/java/com/nexo/server/repositories/KycProfileRepository.java
git add server/src/main/java/com/nexo/server/dto/kycscore/*.java

git commit -m "feat(backend): add KYC Scoring entities and DTOs

- Add KycDocumentScore, KycProfileScore, KycFraudFlag entities
- Implement KYC risk levels and fraud types enums
- Add document hash fields for duplicate detection
- Create repositories for KYC scoring data
- Define DTOs for scoring requests and responses
- Support document and profile scoring models"
```

## 🎯 COMMIT 4: KYC Scoring Engine - Backend Service & AI Integration

```bash
git add server/src/main/java/com/nexo/server/services/KycScoringService.java
git add server/src/main/java/com/nexo/server/services/KycAiServiceClient.java
git add server/src/main/java/com/nexo/server/services/KycService.java
git add server/src/main/java/com/nexo/server/services/FileStorageService.java
git add server/src/main/java/com/nexo/server/controllers/KycScoringController.java
git add server/src/main/java/com/nexo/server/config/RestTemplateConfig.java
git add server/src/main/resources/application.yml

git commit -m "feat(backend): implement KYC Scoring Service with AI integration

- Implement KycScoringService with document and profile scoring
- Add duplicate document detection (SHA-256, perceptual hash)
- Integrate with Python AI service via REST API
- Support OCR, face matching, tampering detection
- Calculate aggregated scores with weighted factors
- Auto-reject on duplicate detection or fraud flags
- Add fallback simulation when AI service unavailable
- Integrate scoring into KYC approval workflow"
```

## 🎯 COMMIT 5: KYC Scoring Engine - AI Service (Python)

```bash
git add ai-service/
git commit -m "feat(ai-service): implement KYC Document Scoring AI service

- Create FastAPI service for document scoring
- Implement OCR extraction using EasyOCR and Tesseract
- Add face matching and liveness detection
- Implement tampering/forgery detection
- Add image quality assessment (blur, resolution)
- Support multiple document types (CCCD, Passport, Driver License)
- Calculate document scores with detailed breakdowns
- Add health check endpoint
- Include setup documentation and requirements"
```

## 🎯 COMMIT 6: KYC Scoring Engine - Frontend

```bash
git add app/src/types/index.ts
git add app/src/services/kycScore.service.ts
git add app/src/hooks/useKycScore.ts
git add app/src/components/kyc-score/*.tsx
git add app/src/pages/admin/KYCDetailPage.tsx
git add app/src/services/index.ts
git add app/src/hooks/index.ts

git commit -m "feat(frontend): implement KYC Scoring UI components

- Add KycScoreCard, KycScoreGauge, KycRiskBadge components
- Implement FraudFlagsList for fraud signal display
- Integrate KYC scoring into admin KYC detail page
- Add score recalculation and duplicate check features
- Support fraud flag resolution workflow
- Add React Query hooks for KYC score data
- Display detailed scoring breakdowns"
```

## 🎯 COMMIT 7: Docker & Configuration

```bash
git add docker-compose.yml
git add .env.example

git commit -m "chore: add Docker Compose and environment configuration

- Add docker-compose.yml for database and services
- Add .env.example with required environment variables
- Configure PostgreSQL database service
- Support local development setup"
```

---

## 📝 LƯU Ý

- **KHÔNG commit**: `docs/`, `.env`, `backend.log`, `scripts/`
- Chạy từng commit một để review dễ dàng
- Kiểm tra `git status` trước mỗi commit
- Nếu có file nào bị thiếu, thêm vào commit tương ứng

## 🔍 Kiểm tra trước khi commit

```bash
# Xem files sẽ được commit
git status

# Xem diff của files
git diff --cached

# Nếu cần thêm file bị thiếu
git add <file-path>
```

