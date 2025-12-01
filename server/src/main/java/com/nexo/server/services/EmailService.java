package com.nexo.server.services;

import com.nexo.server.entities.Loan;
import com.nexo.server.entities.RepaymentSchedule;
import com.nexo.server.entities.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@nexo.vn}")
    private String fromEmail;

    @Value("${app.name:Nexo P2P Lending}")
    private String appName;

    @Async
    public void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("Email sent to: {} - Subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to: {} - Error: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendWelcomeEmail(User user) {
        String subject = "Welcome to " + appName;
        String text = String.format("""
            Hi %s,
            
            Welcome to %s! Your account has been created successfully.
            
            To get started:
            1. Complete your KYC verification
            2. Deposit funds to your wallet
            3. Start borrowing or investing!
            
            If you have any questions, please contact our support team.
            
            Best regards,
            The %s Team
            """, user.getFirstName(), appName, appName);

        sendEmail(user.getEmail(), subject, text);
    }

    // ==================== VERIFICATION EMAILS ====================

    @Async
    public void sendVerificationEmail(String email, String firstName, String verifyLink) {
        String subject = "Verify your email - " + appName;
        String text = String.format("""
            Hi %s,
            
            Thank you for registering with %s!
            
            Please click the link below to verify your email address:
            %s
            
            This link will expire in 48 hours.
            
            If you didn't create an account, please ignore this email.
            
            Best regards,
            The %s Team
            """, firstName, appName, verifyLink, appName);

        sendEmail(email, subject, text);
    }

    // ==================== PASSWORD RESET EMAILS ====================

    @Async
    public void sendPasswordResetEmail(String email, String firstName, String resetLink) {
        String subject = "Reset your password - " + appName;
        String text = String.format("""
            Hi %s,
            
            You requested to reset your password.
            
            Click the link below to reset it:
            %s
            
            This link will expire in 24 hours.
            
            If you didn't request this, please ignore this email or contact support if you have concerns.
            
            Best regards,
            The %s Team
            """, firstName, resetLink, appName);

        sendEmail(email, subject, text);
    }

    @Async
    public void sendPasswordChangedEmail(String email, String firstName) {
        String subject = "Password changed successfully - " + appName;
        String text = String.format("""
            Hi %s,
            
            Your password has been changed successfully.
            
            If you didn't make this change, please contact our support team immediately.
            
            Best regards,
            The %s Team
            """, firstName, appName);

        sendEmail(email, subject, text);
    }

    // ==================== KYC EMAILS ====================

    @Async
    public void sendKycApprovedEmail(String email, String firstName) {
        String subject = "KYC Approved - " + appName;
        String text = String.format("""
            Hi %s,
            
            Great news! Your KYC verification has been approved.
            
            You now have full access to all features:
            - Create loan requests (Borrower)
            - Invest in loans (Lender)
            - Withdraw funds
            
            Start using the platform now!
            
            Best regards,
            The %s Team
            """, firstName, appName);

        sendEmail(email, subject, text);
    }

    @Async
    public void sendKycRejectedEmail(String email, String firstName, String reason) {
        String subject = "KYC Review Update - " + appName;
        String text = String.format("""
            Hi %s,
            
            We regret to inform you that your KYC verification has been rejected.
            
            Reason: %s
            
            You can resubmit your KYC documents after addressing the issues mentioned above.
            
            If you have any questions, please contact our support team.
            
            Best regards,
            The %s Team
            """, firstName, reason != null ? reason : "N/A", appName);

        sendEmail(email, subject, text);
    }

    // ==================== LOAN EMAILS ====================

    @Async
    public void sendLoanApprovedEmail(User user, Loan loan) {
        String subject = "Your Loan Has Been Approved - " + loan.getLoanCode();
        String text = String.format("""
            Hi %s,
            
            Great news! Your loan request %s has been approved.
            
            Loan Details:
            - Amount: %,.0f VND
            - Interest Rate: %s%% per year
            - Term: %d months
            
            Your loan is now open for funding. Once fully funded, the amount will be disbursed to your wallet.
            
            Best regards,
            The %s Team
            """, user.getFirstName(), loan.getLoanCode(), loan.getRequestedAmount(), 
            loan.getInterestRate(), loan.getTermMonths(), appName);

        sendEmail(user.getEmail(), subject, text);
    }

    @Async
    public void sendLoanRejectedEmail(User user, Loan loan) {
        String subject = "Loan Request Update - " + loan.getLoanCode();
        String text = String.format("""
            Hi %s,
            
            We regret to inform you that your loan request %s has been rejected.
            
            Reason: %s
            
            You can submit a new loan request after addressing the issues mentioned above.
            If you have any questions, please contact our support team.
            
            Best regards,
            The %s Team
            """, user.getFirstName(), loan.getLoanCode(), 
            loan.getRejectionReason() != null ? loan.getRejectionReason() : "N/A", appName);

        sendEmail(user.getEmail(), subject, text);
    }

    @Async
    public void sendLoanDisbursedEmail(User user, Loan loan, BigDecimal netAmount) {
        String subject = "Loan Disbursed - " + loan.getLoanCode();
        String text = String.format("""
            Hi %s,
            
            Your loan %s has been fully funded and the amount has been disbursed to your wallet!
            
            Amount Disbursed: %,.0f VND
            
            Please make sure to repay on time to maintain a good credit score.
            
            Best regards,
            The %s Team
            """, user.getFirstName(), loan.getLoanCode(), netAmount, appName);

        sendEmail(user.getEmail(), subject, text);
    }

    @Async
    public void sendLoanFundedNotification(User lender, Loan loan, BigDecimal amount) {
        String subject = "Investment Successful - " + loan.getLoanCode();
        String text = String.format("""
            Hi %s,
            
            Your investment has been successfully processed!
            
            Investment Details:
            - Loan: %s
            - Amount: %,.0f VND
            - Interest Rate: %s%% per year
            
            You will receive returns as the borrower makes repayments.
            
            Best regards,
            The %s Team
            """, lender.getFirstName(), loan.getLoanCode(), amount, loan.getInterestRate(), appName);

        sendEmail(lender.getEmail(), subject, text);
    }

    // ==================== REPAYMENT EMAILS ====================

    @Async
    public void sendRepaymentReminderEmail(User user, Loan loan, RepaymentSchedule schedule) {
        String subject = "Repayment Reminder - " + loan.getLoanCode();
        String text = String.format("""
            Hi %s,
            
            This is a reminder that your repayment for loan %s is due soon.
            
            Due Date: %s
            Amount Due: %,.0f VND
            - Principal: %,.0f VND
            - Interest: %,.0f VND
            
            Please ensure you have sufficient balance in your wallet to make the payment.
            
            Best regards,
            The %s Team
            """, user.getFirstName(), loan.getLoanCode(), schedule.getDueDate(),
            schedule.getTotalAmount(), schedule.getPrincipalAmount(), schedule.getInterestAmount(), appName);

        sendEmail(user.getEmail(), subject, text);
    }

    @Async
    public void sendRepaymentReceivedEmail(User lender, Loan loan, BigDecimal amount) {
        String subject = "Repayment Received - " + loan.getLoanCode();
        String text = String.format("""
            Hi %s,
            
            You have received a repayment from loan %s.
            
            Amount Received: %,.0f VND
            
            The amount has been added to your wallet balance.
            
            Best regards,
            The %s Team
            """, lender.getFirstName(), loan.getLoanCode(), amount, appName);

        sendEmail(lender.getEmail(), subject, text);
    }

    // ==================== WALLET EMAILS ====================

    @Async
    public void sendDepositSuccessEmail(String email, String firstName, BigDecimal amount) {
        String subject = "Deposit Successful - " + appName;
        String text = String.format("""
            Hi %s,
            
            Your deposit has been processed successfully!
            
            Amount: %,.0f VND
            
            The funds are now available in your wallet.
            
            Best regards,
            The %s Team
            """, firstName, amount, appName);

        sendEmail(email, subject, text);
    }

    @Async
    public void sendWithdrawRequestEmail(String email, String firstName, BigDecimal amount) {
        String subject = "Withdrawal Request Received - " + appName;
        String text = String.format("""
            Hi %s,
            
            We have received your withdrawal request.
            
            Amount: %,.0f VND
            
            Your request is being processed and you will be notified once completed.
            
            Best regards,
            The %s Team
            """, firstName, amount, appName);

        sendEmail(email, subject, text);
    }

    @Async
    public void sendWithdrawCompletedEmail(String email, String firstName, BigDecimal amount) {
        String subject = "Withdrawal Completed - " + appName;
        String text = String.format("""
            Hi %s,
            
            Your withdrawal has been completed successfully!
            
            Amount: %,.0f VND
            
            The funds should be transferred to your bank account within 1-3 business days.
            
            Best regards,
            The %s Team
            """, firstName, amount, appName);

        sendEmail(email, subject, text);
    }
}
