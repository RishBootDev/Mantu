package com.rishbootdev.mantu.payment_service.config;

import com.rishbootdev.mantu.common_library.enums.PaymentMethod;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "smart.routing")
public class SmartRoutingProperties {

    private boolean enabled = true;
    private double amountDivisor = 1.0;
    private List<RouteProfile> routes = new ArrayList<>(List.of(
            new RouteProfile(PaymentMethod.CARD, "card_gateway_a", "gateway_a", .93, .90, .89, .02, 600, 180, .95),
            new RouteProfile(PaymentMethod.CARD, "card_gateway_b", "gateway_b", .90, .87, .86, .03, 800, 155, .92),
            new RouteProfile(PaymentMethod.CARD, "card_gateway_c", "gateway_c", .88, .84, .83, .04, 950, 140, .90),
            new RouteProfile(PaymentMethod.UPI, "upi_gateway_a", "gateway_a", .96, .94, .93, .01, 400, 125, .97),
            new RouteProfile(PaymentMethod.UPI, "upi_gateway_b", "gateway_b", .92, .89, .88, .03, 650, 110, .94),
            new RouteProfile(PaymentMethod.UPI, "upi_gateway_c", "gateway_c", .90, .87, .86, .04, 850, 95, .92),
            new RouteProfile(PaymentMethod.NETBANKING, "netbanking_gateway_a", "gateway_a", .89, .85, .84, .04, 900, 170, .91),
            new RouteProfile(PaymentMethod.NETBANKING, "netbanking_gateway_b", "gateway_b", .92, .89, .88, .03, 750, 155, .94),
            new RouteProfile(PaymentMethod.NETBANKING, "netbanking_gateway_c", "gateway_c", .94, .91, .90, .02, 650, 180, .96),
            new RouteProfile(PaymentMethod.WALLET, "wallet_gateway_a", "gateway_a", .95, .92, .91, .02, 500, 120, .96),
            new RouteProfile(PaymentMethod.WALLET, "wallet_gateway_b", "gateway_b", .93, .90, .89, .03, 650, 105, .94),
            new RouteProfile(PaymentMethod.WALLET, "wallet_gateway_c", "gateway_c", .91, .88, .87, .04, 800, 95, .92)
    ));

    public record RouteProfile(
            PaymentMethod paymentMethod,
            String routeId,
            String gateway,
            double healthScore,
            double routeSuccessRate5m,
            double routeSuccessRate1h,
            double routeErrorRate5m,
            int routeP95LatencyMs,
            int routeFeeBps,
            double routeCapacityScore
    ) {
    }
}
