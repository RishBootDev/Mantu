package com.rishbootdev.mantu.api_gateway.security;

import com.rishbootdev.mantu.api_gateway.client.MerchantOnboardingClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MerchantOnboardingGate {

    private final MerchantOnboardingClient merchantOnboardingClient;

    public boolean permits(String merchantId, String requestPath) {
        if (requestPath.startsWith("/v1/merchants/kyc")) {
            return true;
        }
        try {
            return merchantOnboardingClient.getStatus(UUID.fromString(merchantId)).paymentsEnabled();
        } catch (Exception exception) {
            throw new GatewayAuthenticationException("Unable to verify merchant onboarding status");
        }
    }
}
