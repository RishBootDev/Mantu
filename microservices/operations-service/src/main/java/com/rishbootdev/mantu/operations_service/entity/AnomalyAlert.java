package com.rishbootdev.mantu.operations_service.entity;

import com.rishbootdev.mantu.common_library.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;


@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "anomaly_alert", indexes = {
        @Index(name = "idx_anomaly_alert_merchant_window", columnList = "merchant_id, window_start"),
        @Index(name = "idx_anomaly_alert_status", columnList = "status")
})
public class AnomalyAlert extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "source_event_id", nullable = false, unique = true, length = 300)
    private String sourceEventId;

    @Column(name = "merchant_id", nullable = false, length = 100)
    private String merchantId;

    @Column(name = "window_start", nullable = false)
    private LocalDateTime windowStart;

    @Column(name = "window_end", nullable = false)
    private LocalDateTime windowEnd;

    @Column(nullable = false)
    private double anomalyScore;

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(nullable = false, length = 100)
    private String modelVersion;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "OPEN";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> payload;
}
