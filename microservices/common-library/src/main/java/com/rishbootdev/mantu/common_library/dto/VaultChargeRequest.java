package com.rishbootdev.mantu.common_library.dto;

import com.rishbootdev.mantu.common_library.entity.Money;

import java.util.Map;
import java.util.UUID;

public record VaultChargeRequest(
        UUID paymentId,
        String token,
        Money amount,
        Map<String, Object> methodDetails
) {
}
