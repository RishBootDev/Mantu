package com.rishbootdev.mantu.payment_service.dto.response;



import com.rishbootdev.mantu.common_library.entity.Money;
import com.rishbootdev.mantu.common_library.enums.OrderStatus;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public record OrderResponse(

        UUID id,

        UUID merchantId,

        UUID  customerId,

        String receipt,

        Money amount,

        OrderStatus status,

        Integer attempts,

        Map<String, Object> notes,

        LocalDateTime expiresAt,

        LocalDateTime createdAt

) {
}
