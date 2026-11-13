package com.rishbootdev.mantu.payment_service.repository;

import com.rishbootdev.mantu.common_library.enums.OutboxStatus;
import com.rishbootdev.mantu.payment_service.entity.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

    List<OutboxEvent> findByStatusOrderByCreatedAtAsc(OutboxStatus status);
}
