package com.rishbootdev.mantu.merchant_service.dto.response;

import com.rishbootdev.mantu.common_library.enums.MerchantStatus;
import com.rishbootdev.mantu.merchant_service.kyc.KycCaseStatus;

public record LoginResponse(String accessToken, MerchantStatus merchantStatus, KycCaseStatus kycStatus,
                            boolean onboardingComplete) {
}
