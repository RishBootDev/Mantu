package com.rishbootdev.mantu.merchant_service.repository;

import com.rishbootdev.mantu.merchant_service.entity.MerchantKycDocument;
import com.rishbootdev.mantu.merchant_service.kyc.KycDocumentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MerchantKycDocumentRepository extends JpaRepository<MerchantKycDocument, UUID> {
    List<MerchantKycDocument> findByKycCase_IdOrderByCreatedAtAsc(UUID caseId);
    Optional<MerchantKycDocument> findByKycCase_IdAndDocumentType(UUID caseId, KycDocumentType documentType);
}
