package com.rishbootdev.mantu.payment_service.gateway;

import com.rishbootdev.mantu.common_library.enums.PaymentMethod;
import com.rishbootdev.mantu.payment_service.gateway.dto.PaymentRequest;
import com.rishbootdev.mantu.payment_service.gateway.dto.PaymentResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class PaymentGatewayRouter {

    private final Map<PaymentMethod, PaymentAdapter> paymentAdapters;

    public PaymentResult initiate(PaymentRequest request) {
        PaymentAdapter adapter = paymentAdapters.get(request.method());
        if (adapter == null) {
            throw new IllegalArgumentException("No payment adapter registered for method: " + request.method());
        }
        log.info("Initiating paymentId={} through selectedRoute={} adapterMethod={}",
                request.paymentId(), request.selectedRouteId(), request.method());
        return adapter.initiate(request);
    }

    public PaymentResult capture(PaymentMethod method, UUID paymentId) {

        PaymentAdapter adapter = paymentAdapters.get(method);
        if (adapter == null) {
            throw new IllegalArgumentException("No payment adapter registered for method: " + method);
        }
        return adapter.capture(paymentId);

    }
}
