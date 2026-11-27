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

    public record RoutingDecision(String routeId, String modelVersion, boolean placeholder) {
    }

    public String selectRoute(Payment payment) {
        return recommendRoute(payment).routeId();
    }

    public RoutingDecision recommendRoute(Payment payment) {
        List<SmartRoutingProperties.RouteProfile> candidates = properties.getRoutes().stream()
                .filter(route -> route.paymentMethod() == payment.getMethod())
                .toList();
        if (candidates.isEmpty()) {
            log.warn("No configured route candidates for payment method={}", payment.getMethod());
            return new RoutingDecision(null, "none", true);
        }
        String fallbackRoute = candidates.stream()
                .max(Comparator.comparingDouble(SmartRoutingProperties.RouteProfile::healthScore))
                .orElseThrow()
                .routeId();
        if (!properties.isEnabled()) {
            return new RoutingDecision(fallbackRoute, "deterministic_fallback", true);
        }
        try {
            RoutingRecommendationResponse response = smartRoutingClient.recommend(
                    toRequest(payment, candidates)
            );
            if (response.recommendedRouteId() == null) {
                return new RoutingDecision(fallbackRoute, "deterministic_fallback", true);
            }
            log.info("Smart routing completed paymentId={}, routeId={}, modelVersion={}, placeholder={}",
                    payment.getId(), response.recommendedRouteId(), response.modelVersion(), response.placeholder());
            return new RoutingDecision(
                    response.recommendedRouteId(),
                    response.modelVersion(),
                    response.placeholder()
            );
        } catch (Exception exception) {
            log.warn("Smart routing unavailable; using deterministic route paymentId={}, routeId={}, reason={}",
                    payment.getId(), fallbackRoute, exception.getMessage());
            log.debug("Smart routing failure details", exception);
            return new RoutingDecision(fallbackRoute, "deterministic_fallback", true);
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
