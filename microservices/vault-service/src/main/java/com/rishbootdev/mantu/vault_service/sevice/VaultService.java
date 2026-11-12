package com.rishbootdev.mantu.vault_service.sevice;


import com.rishbootdev.mantu.common_library.dto.PaymentProcessorResponse;
import com.rishbootdev.mantu.common_library.entity.Money;
import com.rishbootdev.mantu.vault_service.dto.request.TokenizeRequest;
import com.rishbootdev.mantu.vault_service.dto.response.TokenizeResponse;

import java.util.Map;
import java.util.UUID;

public interface VaultService {
    PaymentProcessorResponse charge(UUID paymentId, String token, Money amount, Map<String, Object> methodDetails);


    TokenizeResponse tokenize(TokenizeRequest request, UUID merchantId);
}
