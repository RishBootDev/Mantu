package com.rishbootdev.mantu.payment_service.gateway.dto;


import com.rishbootdev.mantu.common_library.entity.Money;
import com.rishbootdev.mantu.common_library.enums.PaymentMethod;

import java.util.Map;
import java.util.UUID;

public record PaymentRequest(
        UUID paymentId,
        UUID orderId,
        UUID merchantId,
        Money amount,
        PaymentMethod method,
        Map<String, Object> methodDetails
) {
}
