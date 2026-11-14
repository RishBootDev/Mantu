package com.rishbootdev.mantu.operations_service.settlement;

import com.rishbootdev.mantu.common_library.dto.PaymentSettlementView;
import com.rishbootdev.mantu.common_library.dto.SettlementBankDetails;
import com.rishbootdev.mantu.operations_service.client.MerchantServiceClient;
import com.rishbootdev.mantu.operations_service.client.PaymentServiceClient;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SettlementIntegrationGateway {

    private final MerchantServiceClient merchantServiceClient;
    private final PaymentServiceClient paymentServiceClient;

    @CircuitBreaker(name = "payment-service")
    @Retry(name = "payment-service")
    public List<PaymentSettlementView> findUnsettledCaptured(UUID merchantId) {
        return paymentServiceClient.findUnsettledCaptured(merchantId);
    }

    @CircuitBreaker(name = "payment-service")
    @Retry(name = "payment-service")
    public void markSettled(List<UUID> paymentIds) {
        paymentServiceClient.markSettled(paymentIds);
    }

    @CircuitBreaker(name = "payment-service")
    @Retry(name = "payment-service")
    public SettlementBankDetails getSettlementBankDetails(UUID merchantId) {
        return merchantServiceClient.getSettlementBankDetails(merchantId);
    }
}
