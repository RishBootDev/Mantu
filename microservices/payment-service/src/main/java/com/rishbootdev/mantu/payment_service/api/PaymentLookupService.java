package com.rishbootdev.mantu.payment_service.api;



import com.rishbootdev.mantu.common_library.dto.PaymentSettlementView;

import java.util.List;
import java.util.UUID;

public interface PaymentLookupService {
    List<PaymentSettlementView> findUnsettledCapturedPayments(UUID merchantId);

    void markSettled(List<UUID> paymentIds);
}
