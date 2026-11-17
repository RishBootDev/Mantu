package com.rishbootdev.mantu.operations_service.anomaly;

import com.rishbootdev.mantu.operations_service.entity.AnomalyAlert;
import com.rishbootdev.mantu.operations_service.repository.AnomalyAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AnomalyAlertKafkaConsumer {

    private final AnomalyAlertRepository anomalyAlertRepository;

    @Transactional
    @KafkaListener(
            topics = "${app.kafka.topics.anomaly-alerts:ml.transaction.anomaly.detected}",
            groupId = "${app.kafka.anomaly-alert-group:operations-anomaly-alerts}"
    )
    @SuppressWarnings("unchecked")
    public void onAnomalyAlert(ConsumerRecord<String, Map<String, Object>> record, Acknowledgment ack) {
        Map<String, Object> envelope = record.value();
        if (!"TRANSACTION_ANOMALY_DETECTED".equals(envelope.get("event_type"))) {
            ack.acknowledge();
            return;
        }
        String sourceEventId = requiredString(envelope, "event_id");
        if (anomalyAlertRepository.existsBySourceEventId(sourceEventId)) {
            ack.acknowledge();
            return;
        }
        Object dataValue = envelope.get("data");
        if (!(dataValue instanceof Map<?, ?>)) {
            throw new IllegalArgumentException("Anomaly alert has no data object");
        }
        Map<String, Object> data = (Map<String, Object>) dataValue;
        if (!Boolean.TRUE.equals(data.get("is_anomaly"))) {
            ack.acknowledge();
            return;
        }
        AnomalyAlert alert = AnomalyAlert.builder()
                .sourceEventId(sourceEventId)
                .merchantId(requiredString(data, "merchant_id"))
                .windowStart(parseUtc(requiredString(data, "window_start")))
                .windowEnd(parseUtc(requiredString(data, "window_end")))
                .anomalyScore(number(data, "anomaly_score"))
                .severity(requiredString(data, "severity"))
                .modelVersion(requiredString(data, "model_version"))
                .payload(data)
                .build();
        anomalyAlertRepository.save(alert);
        ack.acknowledge();
        log.warn("Persisted anomaly alert merchantId={}, score={}, severity={}",
                alert.getMerchantId(), alert.getAnomalyScore(), alert.getSeverity());
    }

    private static String requiredString(Map<String, Object> value, String key) {
        Object result = value.get(key);
        if (result == null || result.toString().isBlank()) {
            throw new IllegalArgumentException("Missing anomaly-alert field: " + key);
        }
        return result.toString();
    }

    private static double number(Map<String, Object> value, String key) {
        Object result = value.get(key);
        if (!(result instanceof Number number)) {
            throw new IllegalArgumentException("Invalid numeric anomaly-alert field: " + key);
        }
        return number.doubleValue();
    }

    private static LocalDateTime parseUtc(String value) {
        return LocalDateTime.ofInstant(Instant.parse(value), ZoneOffset.UTC);
    }
}
