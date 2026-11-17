package com.rishbootdev.mantu.merchant_service.controller;

import com.rishbootdev.mantu.common_library.context.MerchantContext;
import com.rishbootdev.mantu.merchant_service.dto.response.KycOnboardingResponse;
import com.rishbootdev.mantu.merchant_service.kyc.KycDocumentType;
import com.rishbootdev.mantu.merchant_service.kyc.MerchantKycService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/v1/merchants/kyc")
@RequiredArgsConstructor
public class MerchantKycController {

    private final MerchantContext merchantContext;
    private final MerchantKycService merchantKycService;

    @GetMapping
    public KycOnboardingResponse status() {
        return merchantKycService.status(merchantContext.getMerchantId());
    }

    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public KycOnboardingResponse upload(@RequestParam KycDocumentType type,
                                        @RequestPart("document") MultipartFile document) {
        return merchantKycService.upload(merchantContext.getMerchantId(), type, document);
    }

    @PostMapping("/submit")
    public ResponseEntity<KycOnboardingResponse> submit() {
        return ResponseEntity.accepted().body(merchantKycService.submit(merchantContext.getMerchantId()));
    }
}
