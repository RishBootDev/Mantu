package com.rishbootdev.mantu.operations_service.repository;


import com.rishbootdev.mantu.common_library.enums.SettlementStatus;
import com.rishbootdev.mantu.operations_service.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SettlementRepository extends JpaRepository<Settlement, UUID> {
    List<Settlement> findByStatus(SettlementStatus settlementStatus);
}
