package com.nexo.server.repositories;

import com.nexo.server.entities.LoanDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanDocumentRepository extends JpaRepository<LoanDocument, Long> {

    List<LoanDocument> findByLoanId(Long loanId);

    void deleteByLoanId(Long loanId);
}


