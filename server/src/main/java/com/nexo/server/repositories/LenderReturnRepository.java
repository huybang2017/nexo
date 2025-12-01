package com.nexo.server.repositories;

import com.nexo.server.entities.LenderReturn;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface LenderReturnRepository extends JpaRepository<LenderReturn, Long> {

    List<LenderReturn> findByRepaymentId(Long repaymentId);

    List<LenderReturn> findByInvestmentId(Long investmentId);

    Page<LenderReturn> findByLenderId(Long lenderId, Pageable pageable);

    @Query("SELECT lr FROM LenderReturn lr JOIN FETCH lr.repayment JOIN FETCH lr.investment WHERE lr.investment.id = :investmentId")
    List<LenderReturn> findByInvestmentIdWithDetails(@Param("investmentId") Long investmentId);

    @Query("SELECT COALESCE(SUM(lr.totalAmount), 0) FROM LenderReturn lr WHERE lr.lender.id = :lenderId")
    BigDecimal sumTotalAmountByLenderId(@Param("lenderId") Long lenderId);

    @Query("SELECT COALESCE(SUM(lr.interestAmount), 0) FROM LenderReturn lr WHERE lr.lender.id = :lenderId")
    BigDecimal sumInterestAmountByLenderId(@Param("lenderId") Long lenderId);

    List<LenderReturn> findByInvestmentIdOrderByCreatedAtDesc(Long investmentId);
}

