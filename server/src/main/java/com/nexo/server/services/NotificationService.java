package com.nexo.server.services;

import com.nexo.server.entities.*;
import com.nexo.server.enums.NotificationType;
import com.nexo.server.enums.UserRole;
import com.nexo.server.exceptions.ForbiddenException;
import com.nexo.server.exceptions.ResourceNotFoundException;
import com.nexo.server.repositories.NotificationRepository;
import com.nexo.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public void createNotification(User user, NotificationType type, String title, String message, String actionUrl) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .actionUrl(actionUrl)
                .build();

        notificationRepository.save(notification);
    }

    @Async
    @Transactional
    public void notifyAdminsNewLoan(Loan loan) {
        List<User> admins = userRepository.findByRole(UserRole.ADMIN, Pageable.unpaged()).getContent();
        
        String title = "New Loan Request";
        String message = String.format("New loan request %s from %s for %s VND", 
                loan.getLoanCode(), loan.getBorrower().getFullName(), loan.getRequestedAmount());

        for (User admin : admins) {
            createNotification(admin, NotificationType.LOAN, title, message, "/admin/loans/" + loan.getId());
        }
    }

    @Async
    @Transactional
    public void notifyLoanApproved(Loan loan) {
        String title = "Loan Approved";
        String message = String.format("Your loan %s has been approved and is now open for funding!", loan.getLoanCode());

        createNotification(loan.getBorrower(), NotificationType.LOAN, title, message, "/borrower/loans/" + loan.getId());
        emailService.sendLoanApprovedEmail(loan.getBorrower(), loan);
    }

    @Async
    @Transactional
    public void notifyLoanRejected(Loan loan) {
        String title = "Loan Rejected";
        String message = String.format("Your loan %s has been rejected. Reason: %s", 
                loan.getLoanCode(), loan.getRejectionReason());

        createNotification(loan.getBorrower(), NotificationType.LOAN, title, message, "/borrower/loans/" + loan.getId());
        emailService.sendLoanRejectedEmail(loan.getBorrower(), loan);
    }

    @Async
    @Transactional
    public void notifyLoanDisbursed(Loan loan) {
        String title = "Loan Disbursed";
        String message = String.format("Your loan %s has been fully funded and disbursed to your wallet!", loan.getLoanCode());

        createNotification(loan.getBorrower(), NotificationType.LOAN, title, message, "/borrower/loans/" + loan.getId());
        emailService.sendLoanDisbursedEmail(loan.getBorrower(), loan, loan.getFundedAmount());

        // Notify all investors
        for (Investment investment : loan.getInvestments()) {
            String investorMsg = String.format("Loan %s has been fully funded. Your investment of %s VND is now active.",
                    loan.getLoanCode(), investment.getAmount());
            createNotification(investment.getLender(), NotificationType.INVESTMENT, "Loan Funded", 
                    investorMsg, "/lender/investments/" + investment.getId());
        }
    }

    @Async
    @Transactional
    public void notifyNewInvestment(Loan loan, Investment investment) {
        String title = "New Investment Received";
        String message = String.format("Your loan %s received a new investment of %s VND. Total funded: %s%%",
                loan.getLoanCode(), investment.getAmount(), loan.getFundingProgress());

        createNotification(loan.getBorrower(), NotificationType.LOAN, title, message, "/borrower/loans/" + loan.getId());
    }

    @Async
    @Transactional
    public void notifyRepaymentDue(Loan loan, RepaymentSchedule schedule) {
        String title = "Repayment Due Soon";
        String message = String.format("Your repayment of %s VND for loan %s is due on %s",
                schedule.getTotalAmount(), loan.getLoanCode(), schedule.getDueDate());

        createNotification(loan.getBorrower(), NotificationType.PAYMENT, title, message, 
                "/borrower/loans/" + loan.getId() + "/schedule");
        emailService.sendRepaymentReminderEmail(loan.getBorrower(), loan, schedule);
    }

    @Async
    @Transactional
    public void notifyLenderReturn(LenderReturn lenderReturn) {
        String title = "Investment Return Received";
        String message = String.format("You received %s VND from loan %s",
                lenderReturn.getTotalAmount(), lenderReturn.getInvestment().getLoan().getLoanCode());

        createNotification(lenderReturn.getLender(), NotificationType.PAYMENT, title, message,
                "/lender/investments/" + lenderReturn.getInvestment().getId());
    }

    public Page<Notification> getNotifications(Long userId, Boolean unreadOnly, Pageable pageable) {
        if (Boolean.TRUE.equals(unreadOnly)) {
            return notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false, pageable);
        }
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        // First verify ownership by checking if notification exists and belongs to user
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        
        // Access user to trigger lazy load within transaction
        Long notificationUserId = notification.getUser().getId();
        
        // Verify ownership
        if (!notificationUserId.equals(userId)) {
            throw new ForbiddenException("You can only mark your own notifications as read");
        }
        
        // Use repository method to update
        notificationRepository.markAsRead(notificationId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        
        // Verify ownership
        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You can only delete your own notifications");
        }
        
        notificationRepository.delete(notification);
        log.info("Notification {} deleted by user {}", notificationId, userId);
    }

    /**
     * Convenience method to create notification by userId and type string
     */
    @Transactional
    public void createNotification(Long userId, String type, String title, String message) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("User not found for notification: {}", userId);
            return;
        }
        NotificationType notificationType = NotificationType.valueOf(type);
        createNotification(user, notificationType, title, message, null);
    }
}

