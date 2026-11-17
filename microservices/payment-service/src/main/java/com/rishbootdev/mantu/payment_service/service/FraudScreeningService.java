package com.rishbootdev.mantu.payment_service.service;

import com.rishbootdev.mantu.common_library.enums.PaymentMethod;
import com.rishbootdev.mantu.payment_service.client.FraudDetectionClient;
import com.rishbootdev.mantu.payment_service.client.dto.FraudPredictionRequest;
import com.rishbootdev.mantu.payment_service.client.dto.FraudPredictionResponse;
import com.rishbootdev.mantu.payment_service.config.FraudDetectionProperties;
import com.rishbootdev.mantu.payment_service.entity.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudScreeningService {

    private final FraudDetectionClient fraudDetectionClient;
    private final FraudDetectionProperties properties;

    public FraudPredictionResponse screen(Payment payment) {
        if (!properties.isEnabled()) {
            return null;
        }
        try {
            FraudPredictionResponse response = fraudDetectionClient.predict(toRequest(payment));
            log.info("Fraud score completed paymentId={}, riskLevel={}, modelVersion={}",
                    payment.getId(), response.riskLevel(), response.modelVersion());
            return response;
        } catch (Exception exception) {
            log.warn("Fraud score unavailable; continuing with configured fallback paymentId={}",
                    payment.getId(), exception);
            return null;
        }
    }

    private FraudPredictionRequest toRequest(Payment payment) {
        return new FraudPredictionRequest(
                payment.getId().toString(),
                payment.getMerchantId().toString(),
                payment.getAmount().getAmountUnits() / properties.getAmountDivisor(),
                payment.getAmount().getCurrency(),
                payment.getMethod().name(),
                payment.getOrder().getCustomerId() == null ? null : payment.getOrder().getCustomerId().toString(),
                payment.getOrder().getAttempts(),
                cardToken(payment),
                0
        );
    }

    private String cardToken(Payment payment) {
        if (payment.getMethod() != PaymentMethod.CARD || payment.getMethodDetails() == null) {
            return null;
        }
        Object token = payment.getMethodDetails().get("token");
        return token instanceof String tokenValue && !tokenValue.isBlank() ? tokenValue : null;
    }
}
