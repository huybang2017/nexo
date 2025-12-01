package com.nexo.server.dto.kyc;

import com.nexo.server.enums.KycStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycProfileResponse {

    private Long id;
    private Long userId;
    private KycStatus status;
    
    // ID Card (masked)
    private String idCardNumber;
    private LocalDate idCardIssuedDate;
    private String idCardIssuedPlace;
    private LocalDate idCardExpiryDate;
    
    // Personal
    private String fullName;
    private String gender;
    private LocalDate dateOfBirth;
    private String nationality;
    
    // Address
    private String address;
    private String city;
    private String district;
    private String ward;
    
    // Employment
    private String occupation;
    private String employerName;
    private BigDecimal monthlyIncome;
    
    // Bank (masked)
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;
    private String bankBranch;
    
    // Documents
    private List<KycDocumentResponse> documents;
    
    // Review
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String rejectionReason;
    
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
}

