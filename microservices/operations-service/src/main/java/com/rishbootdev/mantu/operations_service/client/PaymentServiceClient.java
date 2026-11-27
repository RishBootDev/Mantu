package com.rishbootdev.mantu.operations_service.client;

import com.rishbootdev.mantu.common_library.dto.PaymentSettlementView;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@FeignClient(name = "payment-service", path = "/internal/payments", url = "${PAYMENT_SERVICE_URI:}")
public interface PaymentServiceClient {

    @GetMapping("/unsettled-captured")
    List<PaymentSettlementView> findUnsettledCaptured(@RequestParam UUID merchantId);

    @PostMapping("/mark-settled")
    void markSettled(@RequestBody List<UUID> paymentIds);

    @GetMapping("/risk-summary")
    RiskSummary riskSummary(@RequestParam("hours") int hours);

    @GetMapping("/ops-transactions")
    List<OpsTransactionView> opsTransactions(@RequestParam("limit") int limit);

    record RiskSummary(int windowHours, long totalPayments, long fraudBlockedPayments,
                       long failedPayments, long routedPayments, Map<String, Long> routeDistribution) {
    }

    record OpsTransactionView(
            UUID id,
            UUID orderId,
            UUID merchantId,
            Long amountUnits,
            String currency,
            String status,
            String method,
            Map<String, Object> methodDetails,
            String selectedRouteId,
            String routingModelVersion,
            Boolean routingPlaceholder,
            Double fraudProbability,
            String fraudRiskLevel,
            String fraudModelVersion,
            Boolean fraudPlaceholder,
            String errorCode,
            String errorDescription,
            String bankReference,
            LocalDateTime createdAt,
            LocalDateTime capturedAt
    ) {
    }

}
