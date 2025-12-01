package com.nexo.server.entities;

import com.nexo.server.enums.KycStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "kyc_profiles", indexes = {
    @Index(name = "idx_kyc_user", columnList = "user_id"),
    @Index(name = "idx_kyc_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KycStatus status = KycStatus.NOT_SUBMITTED;

    // ID Card Info
    @Column(name = "id_card_number", length = 20)
    private String idCardNumber;

    @Column(name = "id_card_issued_date")
    private LocalDate idCardIssuedDate;

    @Column(name = "id_card_issued_place")
    private String idCardIssuedPlace;

    @Column(name = "id_card_expiry_date")
    private LocalDate idCardExpiryDate;

    // Personal Info
    @Column(name = "full_name")
    private String fullName;

    @Column(length = 10)
    private String gender;

    @Column(length = 100)
    private String nationality;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    // Address
    private String address;
    private String city;
    private String district;
    private String ward;

    // Employment
    private String occupation;

    @Column(name = "employer_name")
    private String employerName;

    @Column(name = "monthly_income", precision = 18, scale = 2)
    private BigDecimal monthlyIncome;

    // Bank Info
    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_account_holder")
    private String bankAccountHolder;

    @Column(name = "bank_branch")
    private String bankBranch;

    // Review
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    // Documents
    @OneToMany(mappedBy = "kycProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<KycDocument> documents = new ArrayList<>();

    public void addDocument(KycDocument document) {
        documents.add(document);
        document.setKycProfile(this);
    }
}

