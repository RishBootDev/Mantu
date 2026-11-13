package com.rishbootdev.mantu.payment_service.controller;

import com.rishbootdev.mantu.common_library.dto.PaymentSettlementView;
import com.rishbootdev.mantu.payment_service.api.PaymentLookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/payments")
public class InternalMerchantController {

    private final PaymentLookupService paymentLookupService;

    @GetMapping("/unsettled-captured")
    public List<PaymentSettlementView> findUnsettledCaptured(@RequestParam UUID merchantId) {
        return paymentLookupService.findUnsettledCapturedPayments(merchantId);
    }

    @PostMapping("/mark-settled")
    public void markSettled(@RequestBody List<UUID> paymentIds) {
        paymentLookupService.markSettled(paymentIds);
    }
}
