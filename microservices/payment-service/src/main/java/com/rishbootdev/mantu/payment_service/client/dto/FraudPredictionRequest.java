package com.rishbootdev.mantu.payment_service.client.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record FraudPredictionRequest(
        @JsonProperty("transaction_id") String transactionId,
        @JsonProperty("merchant_id") String merchantId,
        double amount,
        String currency,
        @JsonProperty("payment_method") String paymentMethod,
        @JsonProperty("customer_id") String customerId,
        @JsonProperty("order_attempts") int orderAttempts,
        @JsonProperty("card_token_id") String cardTokenId,
        @JsonProperty("transactions_last_10m") int transactionsLast10m
) {
}
