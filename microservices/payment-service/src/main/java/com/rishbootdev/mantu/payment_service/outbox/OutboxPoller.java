package com.rishbootdev.mantu.payment_service.outbox;

import com.rishbootdev.mantu.common_library.config.KafkaProperties;
import com.rishbootdev.mantu.common_library.enums.OutboxStatus;
import com.rishbootdev.mantu.payment_service.entity.OutboxEvent;
import com.rishbootdev.mantu.payment_service.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
@Slf4j
@RequiredArgsConstructor
public class OutboxPoller {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final KafkaProperties kafkaProperties;
    private final OutboxResultHandler outboxResultHandler;

    @Scheduled(fixedRate = 5000)
    @SchedulerLock(name = "payment-service-outbox-poller", lockAtMostFor = "1m", lockAtLeastFor = "1s")
    public void poll(){


        List<OutboxEvent> pendingEvents = outboxEventRepository
                    .findByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);
        for(OutboxEvent event: pendingEvents){
            try {

                String topic = kafkaProperties.topicFor(event.getAggregateType());
                String key = extractMerchantId(event.getPayload());
                LocalDateTime createdAt = event.getCreatedAt() != null ? event.getCreatedAt() : LocalDateTime.now(ZoneOffset.UTC);
                Map<String, Object> envelope = Map.of(
                        "eventId", event.getId().toString(),
                        "eventType", event.getEventType(),
                        "aggregateType", event.getAggregateType(),
                        "aggregateId", event.getAggregateId(),
                        "occurredAt", createdAt.atOffset(ZoneOffset.UTC).toInstant().toString(),
                        "data", event.getPayload()
                );

                kafkaTemplate.send(topic, key, envelope).get(5, TimeUnit.SECONDS);

                outboxResultHandler.handleEventPublished(event);


            }catch (Exception e) {
                    log.error("Outbox event failed, eventId: {}, attempts: {}, error: {}", event.getId(), event.getAttempts(), e.getMessage());
                    outboxResultHandler.handleEventFailed(event, e.getMessage());
            }
        }

    }



    private String extractMerchantId(Map<String,Object> payload){
        Object value = payload.get("merchantId");
        return value != null ? value.toString() : "unknown";
    }
}
