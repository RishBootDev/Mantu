package com.rishbootdev.mantu.operations_service.risk;

import com.rishbootdev.mantu.operations_service.client.PaymentServiceClient;
import com.rishbootdev.mantu.operations_service.entity.AnomalyAlert;
import com.rishbootdev.mantu.operations_service.repository.AnomalyAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/ops/risk-dashboard")
@RequiredArgsConstructor
public class RiskDashboardController {

    private static final String OPS_ROLE = "MANTU_OPS_ADMIN";

    private final AnomalyAlertRepository anomalyAlertRepository;
    private final PaymentServiceClient paymentServiceClient;

    @GetMapping
    public DashboardView dashboard(@RequestHeader(value = "X-User-Role", required = false) String role,
                                   @RequestParam(defaultValue = "0") int hours) {
        requireOperationsAccess(role);
        int safeHours = hours <= 0 ? 0 : Math.clamp(hours, 1, 8760);
        var alerts = anomalyAlertRepository.findAllByOrderByWindowStartDesc(
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "windowStart"))
        );
        long openAlerts = anomalyAlertRepository.countByStatus("OPEN");
        long criticalAlerts = anomalyAlertRepository.countByStatusAndSeverity("OPEN", "CRITICAL");

        PaymentServiceClient.RiskSummary payments;
        try {
            payments = paymentServiceClient.riskSummary(safeHours);
        } catch (Exception ignored) {
            payments = new PaymentServiceClient.RiskSummary(safeHours, 0, 0, 0, 0, Map.of());
        }

        return new DashboardView(
                LocalDateTime.now(), payments,
                new AnomalySummary(openAlerts, criticalAlerts),
                alerts.getContent().stream().map(AlertView::from).toList()
        );
    }

    @GetMapping("/transactions")
    public List<PaymentServiceClient.OpsTransactionView> transactions(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(defaultValue = "200") int limit) {
        requireOperationsAccess(role);
        int safeLimit = Math.clamp(limit, 1, 500);
        return paymentServiceClient.opsTransactions(safeLimit);
    }

    private void requireOperationsAccess(String role) {
        if (!OPS_ROLE.equals(role)) {
            throw new OperationsAccessDeniedException();
        }
    }

    public record DashboardView(LocalDateTime generatedAt, PaymentServiceClient.RiskSummary payments,
                                AnomalySummary anomalies, List<AlertView> recentAlerts) {
    }

    public record AnomalySummary(long openAlerts, long criticalAlerts) {
    }

    public record AlertView(String id, String merchantId, LocalDateTime windowStart, LocalDateTime windowEnd,
                            double anomalyScore, String severity, String modelVersion, String status,
                            List<String> explanation) {
        static AlertView from(AnomalyAlert alert) {
            Object rawExplanation = alert.getPayload().get("explanation");
            List<String> explanation = rawExplanation instanceof List<?> list
                    ? list.stream().map(String::valueOf).toList() : List.of();
            return new AlertView(alert.getId().toString(), alert.getMerchantId(), alert.getWindowStart(),
                    alert.getWindowEnd(), alert.getAnomalyScore(), alert.getSeverity(), alert.getModelVersion(),
                    alert.getStatus(), explanation);
        }
    }

    @ResponseStatus(HttpStatus.FORBIDDEN)
    private static class OperationsAccessDeniedException extends RuntimeException {
    }
}
