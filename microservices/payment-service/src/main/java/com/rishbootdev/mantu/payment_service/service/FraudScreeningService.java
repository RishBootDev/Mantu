package com.rishbootdev.mantu.payment_service.service;

import com.rishbootdev.mantu.common_library.enums.PaymentMethod;
import com.rishbootdev.mantu.payment_service.client.FraudDetectionClient;
import com.rishbootdev.mantu.payment_service.client.dto.FraudPredictionRequest;
import com.rishbootdev.mantu.payment_service.client.dto.FraudPredictionResponse;
import com.rishbootdev.mantu.payment_service.config.FraudDetectionProperties;
import com.rishbootdev.mantu.payment_service.entity.Payment;
import com.rishbootdev.mantu.payment_service.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudScreeningService {

    private final FraudDetectionClient fraudDetectionClient;
    private final FraudDetectionProperties properties;
    private final PaymentRepository paymentRepository;

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
            log.warn("Fraud score unavailable; continuing with configured fallback paymentId={}, reason={}",
                    payment.getId(), exception.getMessage());
            log.debug("Fraud score failure details", exception);
            return null;
        }
    }

    private FraudPredictionRequest toRequest(Payment payment) {
        int velocity = 0;
        if (payment.getOrder().getCustomerId() != null) {
            long recentCount = paymentRepository.countRecentByCustomer(
                    payment.getOrder().getCustomerId(),
                    LocalDateTime.now().minusMinutes(10)
            );
            velocity = Math.max(0, (int) recentCount - 1);
        }
        Map<String, Object> details = payment.getMethodDetails();
        return new FraudPredictionRequest(
                payment.getId().toString(),
                payment.getMerchantId().toString(),
                payment.getAmount().getAmountUnits() / properties.getAmountDivisor(),
                payment.getAmount().getCurrency(),
                payment.getMethod().name(),
                payment.getOrder().getCustomerId() == null ? null : payment.getOrder().getCustomerId().toString(),
                payment.getOrder().getAttempts(),
                cardToken(payment),
                velocity,
                Instant.now(),
                stringDetail(details, "device_id"),
                stringDetail(details, "ip_country"),
                stringDetail(details, "billing_country"),
                stringDetail(details, "email_domain")
        );
    }

    private String stringDetail(Map<String, Object> details, String key) {
        if (details == null) {
            return null;
        }
        Object value = details.get(key);
        return value instanceof String str && !str.isBlank() ? str.trim() : null;
    }

    private String cardToken(Payment payment) {
        if (payment.getMethod() != PaymentMethod.CARD || payment.getMethodDetails() == null) {
            return null;
        }
        Object token = payment.getMethodDetails().get("token");
        return token instanceof String tokenValue && !tokenValue.isBlank() ? tokenValue : null;
    }
}
