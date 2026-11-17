package com.rishbootdev.mantu.payment_service.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EligibleRoute(
        @JsonProperty("route_id") String routeId,
        String gateway,
        @JsonProperty("health_score") double healthScore,
        @JsonProperty("route_success_rate_5m") double routeSuccessRate5m,
        @JsonProperty("route_success_rate_1h") double routeSuccessRate1h,
        @JsonProperty("route_error_rate_5m") double routeErrorRate5m,
        @JsonProperty("route_p95_latency_ms") int routeP95LatencyMs,
        @JsonProperty("route_fee_bps") int routeFeeBps,
        @JsonProperty("route_capacity_score") double routeCapacityScore
) {
}
