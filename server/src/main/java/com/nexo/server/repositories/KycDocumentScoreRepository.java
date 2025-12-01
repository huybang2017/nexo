package com.nexo.server.repositories;

import com.nexo.server.entities.KycDocumentScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KycDocumentScoreRepository extends JpaRepository<KycDocumentScore, Long> {

    Optional<KycDocumentScore> findByKycDocumentId(Long documentId);

    List<KycDocumentScore> findByKycProfileId(Long profileId);

    @Query("SELECT AVG(ds.totalScore) FROM KycDocumentScore ds WHERE ds.kycProfile.id = :profileId")
    Double getAverageDocumentScore(@Param("profileId") Long profileId);

    @Query("SELECT ds FROM KycDocumentScore ds WHERE ds.kycProfile.id = :profileId ORDER BY ds.totalScore DESC")
    List<KycDocumentScore> findByKycProfileIdOrderByScoreDesc(@Param("profileId") Long profileId);
}


