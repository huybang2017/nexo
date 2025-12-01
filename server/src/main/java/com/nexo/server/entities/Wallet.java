package com.nexo.server.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "wallets", indexes = {
    @Index(name = "idx_wallet_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "locked_balance", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal lockedBalance = BigDecimal.ZERO;

    @Column(length = 3)
    @Builder.Default
    private String currency = "VND";

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    public BigDecimal getAvailableBalance() {
        return balance.subtract(lockedBalance);
    }

    public void deposit(BigDecimal amount) {
        this.balance = this.balance.add(amount);
    }

    public void withdraw(BigDecimal amount) {
        if (getAvailableBalance().compareTo(amount) < 0) {
            throw new IllegalStateException("Insufficient balance");
        }
        this.balance = this.balance.subtract(amount);
    }

    public void lock(BigDecimal amount) {
        if (getAvailableBalance().compareTo(amount) < 0) {
            throw new IllegalStateException("Insufficient balance to lock");
        }
        this.lockedBalance = this.lockedBalance.add(amount);
    }

    public void unlock(BigDecimal amount) {
        this.lockedBalance = this.lockedBalance.subtract(amount);
        if (this.lockedBalance.compareTo(BigDecimal.ZERO) < 0) {
            this.lockedBalance = BigDecimal.ZERO;
        }
    }

    public void confirmLockedTransaction(BigDecimal amount) {
        this.lockedBalance = this.lockedBalance.subtract(amount);
        this.balance = this.balance.subtract(amount);
    }
}

