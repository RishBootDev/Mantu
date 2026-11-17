package com.rishbootdev.mantu.merchant_service.dto.response;

import com.rishbootdev.mantu.common_library.enums.MerchantStatus;
import com.rishbootdev.mantu.merchant_service.kyc.KycCaseStatus;
import com.rishbootdev.mantu.merchant_service.kyc.KycDocumentType;

import java.time.LocalDateTime;
import java.util.List;

public record KycOnboardingResponse(
        MerchantStatus merchantStatus,
        KycCaseStatus kycStatus,
        boolean onboardingComplete,
        List<KycDocumentType> requiredDocuments,
        List<KycDocumentResponse> documents,
        String reviewerNote,
        LocalDateTime submittedAt
) {
}
