package com.rishbootdev.mantu.operations_service.entity;

import com.rishbootdev.mantu.common_library.entity.BaseEntity;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.util.UUID;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode
public class SettlementPaymentId extends BaseEntity {

    private UUID settlementId;

    private UUID paymentId;
}
