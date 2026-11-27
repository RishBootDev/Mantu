package com.rishbootdev.mantu.operations_service.repository;

import com.rishbootdev.mantu.operations_service.entity.AnomalyAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AnomalyAlertRepository extends JpaRepository<AnomalyAlert, UUID> {
    boolean existsBySourceEventId(String sourceEventId);

    Page<AnomalyAlert> findAllByOrderByWindowStartDesc(Pageable pageable);

    long countByStatus(String status);

    long countByStatusAndSeverity(String status, String severity);
}
