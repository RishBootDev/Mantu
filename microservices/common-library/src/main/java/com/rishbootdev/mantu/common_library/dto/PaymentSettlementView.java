package com.rishbootdev.mantu.common_library.dto;

import java.util.UUID;

public record PaymentSettlementView(
        UUID paymentId,
        int amountUnits,
        int RefundAmountUnits,
        String currency
) {
}
