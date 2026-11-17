package com.rishbootdev.mantu.merchant_service.dto.response;

import com.rishbootdev.mantu.common_library.enums.MerchantStatus;

public record MerchantOnboardingStatusResponse(MerchantStatus merchantStatus, boolean paymentsEnabled) {
}
