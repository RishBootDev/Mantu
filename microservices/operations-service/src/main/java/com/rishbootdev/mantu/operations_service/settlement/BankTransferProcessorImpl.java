package com.rishbootdev.mantu.operations_service.settlement;


import com.rishbootdev.mantu.common_library.entity.Money;
import com.rishbootdev.mantu.common_library.util.RandomizerUtil;
import com.rishbootdev.mantu.operations_service.settlement.dto.BankTransferResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;
@Component
@Slf4j
public class BankTransferProcessorImpl implements BankTransferProcessor {
    @Override
    public BankTransferResult initiate(UUID settlementId, UUID merchantId, Money amount, String bankAccount, String ifsc) {

        // call the Bank API

        String registrationRef = "TXN_" + RandomizerUtil.randomBase64(12);

        log.debug("Bank transfer call completed for settlementId: {}, registrationRef: {}", settlementId, registrationRef);

        return new BankTransferResult(registrationRef);
    }
}
