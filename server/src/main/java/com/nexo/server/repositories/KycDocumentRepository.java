package com.nexo.server.repositories;

import com.nexo.server.entities.KycDocument;
import com.nexo.server.enums.KycDocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KycDocumentRepository extends JpaRepository<KycDocument, Long> {

    List<KycDocument> findByKycProfileId(Long kycProfileId);

    Optional<KycDocument> findByKycProfileIdAndDocumentType(Long kycProfileId, KycDocumentType documentType);

    boolean existsByKycProfileIdAndDocumentType(Long kycProfileId, KycDocumentType documentType);

    void deleteByKycProfileId(Long kycProfileId);

    // Duplicate detection by document hash (exact match)
    @Query("SELECT d FROM KycDocument d WHERE d.documentHash = :hash AND d.kycProfile.id != :excludeProfileId")
    List<KycDocument> findDuplicateByHash(@Param("hash") String hash, @Param("excludeProfileId") Long excludeProfileId);

    // Duplicate detection by perceptual hash (similar images)
    @Query("SELECT d FROM KycDocument d WHERE d.perceptualHash = :hash AND d.kycProfile.id != :excludeProfileId")
    List<KycDocument> findSimilarByPerceptualHash(@Param("hash") String hash, @Param("excludeProfileId") Long excludeProfileId);

    // Duplicate detection by extracted ID number
    @Query("SELECT d FROM KycDocument d WHERE d.extractedIdNumber = :idNumber AND d.kycProfile.id != :excludeProfileId")
    List<KycDocument> findByExtractedIdNumber(@Param("idNumber") String idNumber, @Param("excludeProfileId") Long excludeProfileId);

    // Check if document hash exists (for any profile)
    boolean existsByDocumentHash(String documentHash);

    // Check if extracted ID number exists (for any profile)
    boolean existsByExtractedIdNumber(String extractedIdNumber);

    // Find all documents with same extracted ID (potential duplicates)
    @Query("SELECT d FROM KycDocument d WHERE d.extractedIdNumber = :idNumber ORDER BY d.createdAt DESC")
    List<KycDocument> findAllByExtractedIdNumber(@Param("idNumber") String idNumber);
}

