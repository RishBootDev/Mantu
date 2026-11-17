package com.rishbootdev.mantu.payment_service.service;

import com.rishbootdev.mantu.payment_service.client.SmartRoutingClient;
import com.rishbootdev.mantu.payment_service.client.dto.EligibleRoute;
import com.rishbootdev.mantu.payment_service.client.dto.RoutingRecommendationRequest;
import com.rishbootdev.mantu.payment_service.client.dto.RoutingRecommendationResponse;
import com.rishbootdev.mantu.payment_service.config.SmartRoutingProperties;
import com.rishbootdev.mantu.payment_service.entity.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmartRoutingService {

    private final SmartRoutingClient smartRoutingClient;
    private final SmartRoutingProperties properties;

    public String selectRoute(Payment payment) {
        List<SmartRoutingProperties.RouteProfile> candidates = properties.getRoutes().stream()
                .filter(route -> route.paymentMethod() == payment.getMethod())
                .toList();
        if (candidates.isEmpty()) {
            log.warn("No configured route candidates for payment method={}", payment.getMethod());
            return null;
        }
        String fallbackRoute = candidates.stream()
                .max(Comparator.comparingDouble(SmartRoutingProperties.RouteProfile::healthScore))
                .orElseThrow()
                .routeId();
        if (!properties.isEnabled()) {
            return fallbackRoute;
        }
        try {
            RoutingRecommendationResponse response = smartRoutingClient.recommend(
                    toRequest(payment, candidates)
            );
            if (response.recommendedRouteId() == null) {
                return fallbackRoute;
            }
            log.info("Smart routing completed paymentId={}, routeId={}, modelVersion={}, placeholder={}",
                    payment.getId(), response.recommendedRouteId(), response.modelVersion(), response.placeholder());
            return response.recommendedRouteId();
        } catch (Exception exception) {
            log.warn("Smart routing unavailable; using deterministic route paymentId={}, routeId={}",
                    payment.getId(), fallbackRoute, exception);
            return fallbackRoute;
        }
    }

    private RoutingRecommendationRequest toRequest(
            Payment payment, List<SmartRoutingProperties.RouteProfile> candidates
    ) {
        return new RoutingRecommendationRequest(
                payment.getId().toString(),
                payment.getMerchantId().toString(),
                payment.getAmount().getAmountUnits() / properties.getAmountDivisor(),
                payment.getAmount().getCurrency(),
                payment.getMethod().name(),
                payment.getOrder().getAttempts(),
                null,
                null,
                candidates.stream().map(this::toEligibleRoute).toList()
        );
    }

    private EligibleRoute toEligibleRoute(SmartRoutingProperties.RouteProfile route) {
        return new EligibleRoute(
                route.routeId(), route.gateway(), route.healthScore(), route.routeSuccessRate5m(),
                route.routeSuccessRate1h(), route.routeErrorRate5m(), route.routeP95LatencyMs(),
                route.routeFeeBps(), route.routeCapacityScore()
        );
    }
}
