package com.rishbootdev.mantu.merchant_service.controller;

import com.rishbootdev.mantu.common_library.dto.SettlementBankDetails;
import com.rishbootdev.mantu.common_library.dto.WebhookTarget;
import com.rishbootdev.mantu.merchant_service.api.MerchantLookupService;
import com.rishbootdev.mantu.merchant_service.dto.response.MerchantOnboardingStatusResponse;
import com.rishbootdev.mantu.merchant_service.kyc.MerchantKycService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/merchants")
public class InternalMerchantController {

    private final MerchantLookupService merchantLookupService;
    private final MerchantKycService merchantKycService;

    @GetMapping("/{merchantId}/onboarding-status")
    public MerchantOnboardingStatusResponse onboardingStatus(@PathVariable UUID merchantId) {
        return merchantKycService.onboardingStatus(merchantId);
    }

    @GetMapping("/{merchantId}/webhook-targets")
    public List<WebhookTarget> getActiveConfigsForEvent(@PathVariable UUID merchantId, @RequestBody String eventType) {
        return merchantLookupService.getActiveConfigsForEvent(merchantId, eventType);
    }

    @GetMapping("/active-ids")
    public List<UUID> listActiveMerchantIds(@PathVariable UUID merchantId, @RequestBody String eventType) {
        return merchantLookupService.listActiveMerchantIds();
    }

    @GetMapping("/{merchantId}/settlement-bank-details")
    public SettlementBankDetails getSettlementBankDetails(@PathVariable UUID merchantId) {
        return merchantLookupService.getSettlementBankDetails(merchantId);
    }
}
