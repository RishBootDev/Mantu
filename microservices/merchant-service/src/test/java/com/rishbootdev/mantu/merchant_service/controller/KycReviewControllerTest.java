package com.rishbootdev.mantu.merchant_service.controller;

import com.rishbootdev.mantu.merchant_service.entity.Merchant;
import com.rishbootdev.mantu.merchant_service.entity.MerchantKycCase;
import com.rishbootdev.mantu.merchant_service.entity.MerchantKycDocument;
import com.rishbootdev.mantu.merchant_service.kyc.KycCaseStatus;
import com.rishbootdev.mantu.merchant_service.kyc.KycDocumentType;
import com.rishbootdev.mantu.merchant_service.kyc.MerchantKycService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KycReviewControllerTest {

    @Mock
    private MerchantKycService merchantKycService;

    @InjectMocks
    private KycReviewController kycReviewController;

    @Test
    void reviewPage_rendersSuccessfullyWithoutFormatExceptions() {
        String token = "sample-token-123";
        UUID caseId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();

        Merchant merchant = Merchant.builder()
                .name("Acme Admin")
                .businessName("Acme Retail Store")
                .build();

        MerchantKycCase kycCase = MerchantKycCase.builder()
                .id(caseId)
                .merchant(merchant)
                .status(KycCaseStatus.UNDER_REVIEW)
                .build();

        MerchantKycDocument doc = MerchantKycDocument.builder()
                .id(docId)
                .kycCase(kycCase)
                .documentType(KycDocumentType.PAN)
                .originalFilename("pan.jpg")
                .build();

        when(merchantKycService.reviewCase(token)).thenReturn(kycCase);
        when(merchantKycService.documentsForReview(token)).thenReturn(List.of(doc));

        ResponseEntity<String> response = kycReviewController.reviewPage(token);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        String body = response.getBody();
        assertNotNull(body);
        assertTrue(body.contains("Acme Admin"));
        assertTrue(body.contains("Acme Retail Store"));
        assertTrue(body.contains(caseId.toString()));
        assertTrue(body.contains("pan.jpg"));
        assertTrue(body.contains("width: 100%"));
    }
}
