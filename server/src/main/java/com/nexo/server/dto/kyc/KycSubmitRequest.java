package com.nexo.server.dto.kyc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycSubmitRequest {

    @NotBlank(message = "ID card number is required")
    @Pattern(regexp = "^[0-9]{9,12}$", message = "Invalid ID card number format")
    private String idCardNumber;

    @NotNull(message = "ID card issued date is required")
    private LocalDate idCardIssuedDate;

    @NotBlank(message = "ID card issued place is required")
    private String idCardIssuedPlace;

    private LocalDate idCardExpiryDate;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Gender is required")
    private String gender;

    @NotNull(message = "Date of birth is required")
    private LocalDate dateOfBirth;

    private String nationality;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    private String district;
    private String ward;

    private String occupation;
    private String employerName;
    private BigDecimal monthlyIncome;

    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotBlank(message = "Bank account number is required")
    private String bankAccountNumber;

    @NotBlank(message = "Bank account holder name is required")
    private String bankAccountHolder;

    private String bankBranch;
}

