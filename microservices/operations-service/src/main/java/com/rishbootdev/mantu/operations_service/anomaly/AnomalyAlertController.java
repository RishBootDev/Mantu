package com.rishbootdev.mantu.operations_service.anomaly;

import com.rishbootdev.mantu.operations_service.entity.AnomalyAlert;
import com.rishbootdev.mantu.operations_service.repository.AnomalyAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/internal/anomaly-alerts")
@RequiredArgsConstructor
public class AnomalyAlertController {

    private final AnomalyAlertRepository anomalyAlertRepository;

    @GetMapping
    public AlertPage list(@RequestParam(defaultValue = "0") int page,
                          @RequestParam(defaultValue = "50") int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.clamp(size, 1, 100);
        Page<AnomalyAlert> alerts = anomalyAlertRepository.findAllByOrderByWindowStartDesc(
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "windowStart"))
        );
        return new AlertPage(
                alerts.getContent().stream().map(AlertView::from).toList(),
                alerts.getNumber(), alerts.getSize(), alerts.getTotalElements(), alerts.getTotalPages()
        );
    }

    public record AlertPage(List<AlertView> items, int page, int size, long totalElements, int totalPages) {
    }

    public record AlertView(
            String id, String merchantId, LocalDateTime windowStart, LocalDateTime windowEnd,
            double anomalyScore, String severity, String modelVersion, String status,
            List<String> explanation
    ) {
        static AlertView from(AnomalyAlert alert) {
            Object rawExplanation = alert.getPayload().get("explanation");
            List<String> explanation = rawExplanation instanceof List<?> list
                    ? list.stream().map(String::valueOf).toList()
                    : List.of();
            return new AlertView(
                    alert.getId().toString(), alert.getMerchantId(), alert.getWindowStart(), alert.getWindowEnd(),
                    alert.getAnomalyScore(), alert.getSeverity(), alert.getModelVersion(), alert.getStatus(), explanation
            );
        }
    }
}
