package com.rishbootdev.mantu.api_gateway.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "merchant-service", path = "/internal/merchants", url = "${MERCHANT_SERVICE_URI:}", contextId = "merchantOnboardingClient")
public interface MerchantOnboardingClient {

    @GetMapping("/{merchantId}/onboarding-status")
    MerchantOnboardingStatus getStatus(@PathVariable UUID merchantId);

    record MerchantOnboardingStatus(String merchantStatus, boolean paymentsEnabled) {
    }
}
