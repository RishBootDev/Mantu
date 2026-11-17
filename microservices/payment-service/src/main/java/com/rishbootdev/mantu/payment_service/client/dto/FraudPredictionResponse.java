package com.rishbootdev.mantu.payment_service.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record FraudPredictionResponse(
        @JsonProperty("transaction_id") String transactionId,
        @JsonProperty("fraud_probability") double fraudProbability,
        @JsonProperty("risk_level") String riskLevel,
        @JsonProperty("model_version") String modelVersion,
        @JsonProperty("is_placeholder") boolean placeholder
) {
    public boolean isHighRisk() {
        return "HIGH".equalsIgnoreCase(riskLevel) && !placeholder;
    }
}
