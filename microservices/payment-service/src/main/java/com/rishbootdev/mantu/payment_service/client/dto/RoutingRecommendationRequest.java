package com.rishbootdev.mantu.payment_service.client.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RoutingRecommendationRequest(
        @JsonProperty("transaction_id") String transactionId,
        @JsonProperty("merchant_id") String merchantId,
        double amount,
        String currency,
        @JsonProperty("payment_method") String paymentMethod,
        @JsonProperty("order_attempts") int orderAttempts,
        @JsonProperty("issuer_group") String issuerGroup,
        @JsonProperty("card_network") String cardNetwork,
        @JsonProperty("eligible_routes") List<EligibleRoute> eligibleRoutes
) {
}
