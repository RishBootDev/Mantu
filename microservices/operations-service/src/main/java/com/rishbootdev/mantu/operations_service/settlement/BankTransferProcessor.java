package com.rishbootdev.mantu.operations_service.settlement;



import com.rishbootdev.mantu.common_library.entity.Money;
import com.rishbootdev.mantu.operations_service.settlement.dto.BankTransferResult;

import java.util.UUID;

public interface BankTransferProcessor {
    BankTransferResult initiate(UUID settlementId, UUID merchantId, Money amount, String bankAccount, String ifsc);
}
