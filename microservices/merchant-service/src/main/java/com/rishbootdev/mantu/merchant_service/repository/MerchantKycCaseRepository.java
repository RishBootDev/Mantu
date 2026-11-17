package com.rishbootdev.mantu.merchant_service.repository;

import com.rishbootdev.mantu.merchant_service.entity.MerchantKycCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

public interface MerchantKycCaseRepository extends JpaRepository<MerchantKycCase, UUID> {
    Optional<MerchantKycCase> findByMerchant_Id(UUID merchantId);
    Optional<MerchantKycCase> findByReviewerTokenHash(String reviewerTokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<MerchantKycCase> findWithLockById(UUID id);
}
