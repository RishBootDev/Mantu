package com.rishbootdev.mantu.merchant_service.api;


import com.rishbootdev.mantu.common_library.dto.SettlementBankDetails;
import com.rishbootdev.mantu.common_library.dto.WebhookTarget;

import java.util.List;
import java.util.UUID;

public interface MerchantLookupService {

    List<WebhookTarget> getActiveConfigsForEvent(UUID merchantId, String eventType);

    List<UUID> listActiveMerchantIds();

    SettlementBankDetails getSettlementBankDetails(UUID merchantId);

}
