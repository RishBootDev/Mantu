package com.rishbootdev.mantu.merchant_service.dto.response;

import com.rishbootdev.mantu.common_library.enums.BusinessType;
import com.rishbootdev.mantu.common_library.enums.MerchantStatus;

import java.util.UUID;

public record MerchantResponse(
        UUID id,
        String name,
        String email,
        String businessName,
        BusinessType businessType,
        MerchantStatus merchantStatus
) {
}
