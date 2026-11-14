package com.rishbootdev.mantu.operations_service.repository;

import com.rishbootdev.mantu.common_library.enums.WebhookEventStatus;
import com.rishbootdev.mantu.operations_service.entity.WebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, UUID> {
    List<WebhookEvent> findByStatusAndNextRetryAtBefore(WebhookEventStatus webhookEventStatus, LocalDateTime now);
}
