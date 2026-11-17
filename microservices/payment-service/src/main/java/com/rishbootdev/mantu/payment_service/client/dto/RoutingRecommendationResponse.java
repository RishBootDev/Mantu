package com.rishbootdev.mantu.payment_service.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RoutingRecommendationResponse(
        @JsonProperty("transaction_id") String transactionId,
        @JsonProperty("recommended_route_id") String recommendedRouteId,
        @JsonProperty("model_version") String modelVersion,
        @JsonProperty("is_placeholder") boolean placeholder
) {
}
