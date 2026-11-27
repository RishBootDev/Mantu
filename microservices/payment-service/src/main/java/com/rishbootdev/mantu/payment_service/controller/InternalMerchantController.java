package com.rishbootdev.mantu.payment_service.controller;

import com.rishbootdev.mantu.common_library.dto.PaymentSettlementView;
import com.rishbootdev.mantu.payment_service.api.PaymentLookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.rishbootdev.mantu.common_library.enums.PaymentMethod;
import com.rishbootdev.mantu.common_library.enums.PaymentStatus;
import org.springframework.data.domain.PageRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import com.rishbootdev.mantu.payment_service.repository.PaymentRepository;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/payments")
public class InternalMerchantController {

    private final PaymentLookupService paymentLookupService;
    private final PaymentRepository paymentRepository;

    @GetMapping("/unsettled-captured")
    public List<PaymentSettlementView> findUnsettledCaptured(@RequestParam UUID merchantId) {
        return paymentLookupService.findUnsettledCapturedPayments(merchantId);
    }

    @PostMapping("/mark-settled")
    public void markSettled(@RequestBody List<UUID> paymentIds) {
        paymentLookupService.markSettled(paymentIds);
    }

    @GetMapping("/risk-summary")
    public RiskSummary riskSummary(@RequestParam(name = "hours", defaultValue = "0") int hours) {
        int safeHours = hours <= 0 ? 0 : Math.clamp(hours, 1, 8760);
        var payments = safeHours == 0
                ? paymentRepository.findAll()
                : paymentRepository.findByCreatedAtGreaterThanEqual(LocalDateTime.now().minusHours(safeHours));
        long total = payments.size();
        long fraudBlocks = payments.stream().filter(payment -> "FRAUD_HIGH_RISK".equals(payment.getErrorCode())).count();
        long failed = payments.stream().filter(payment -> payment.getStatus() == PaymentStatus.FAILED).count();
        long routed = payments.stream().filter(payment -> payment.getSelectedRouteId() != null).count();
        Map<String, Long> routes = payments.stream()
                .filter(payment -> payment.getSelectedRouteId() != null)
                .collect(Collectors.groupingBy(payment -> payment.getSelectedRouteId(), Collectors.counting()));

        return new RiskSummary(safeHours, total, fraudBlocks, failed, routed, routes);
    }

    @GetMapping("/ops-transactions")
    public List<OpsTransactionView> opsTransactions(@RequestParam(name = "limit", defaultValue = "200") int limit) {
        int safeLimit = Math.clamp(limit, 1, 500);
        return paymentRepository.findAllRecentWithOrder(PageRequest.of(0, safeLimit)).stream()
                .map(payment -> new OpsTransactionView(
                        payment.getId(),
                        payment.getOrder().getId(),
                        payment.getMerchantId(),
                        (long) payment.getAmount().getAmountUnits(),
                        payment.getAmount().getCurrency(),
                        payment.getStatus(),
                        payment.getMethod(),
                        payment.getMethodDetails(),
                        payment.getSelectedRouteId(),
                        payment.getRoutingModelVersion(),
                        payment.getRoutingPlaceholder(),
                        payment.getFraudProbability(),
                        payment.getFraudRiskLevel(),
                        payment.getFraudModelVersion(),
                        payment.getFraudPlaceholder(),
                        payment.getErrorCode(),
                        payment.getErrorDescription(),
                        payment.getBankReference(),
                        payment.getCreatedAt(),
                        payment.getCapturedAt()
                ))
                .toList();
    }

    public record RiskSummary(int windowHours, long totalPayments, long fraudBlockedPayments,
                              long failedPayments, long routedPayments, Map<String, Long> routeDistribution) {
    }

    public record OpsTransactionView(
            UUID id,
            UUID orderId,
            UUID merchantId,
            Long amountUnits,
            String currency,
            PaymentStatus status,
            PaymentMethod method,
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
