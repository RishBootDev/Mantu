package com.rishbootdev.mantu.payment_service.service.impl;

import com.rishbootdev.mantu.common_library.enums.EventAggregateType;
import com.rishbootdev.mantu.common_library.enums.OrderStatus;
import com.rishbootdev.mantu.common_library.enums.PaymentEvent;
import com.rishbootdev.mantu.common_library.enums.PaymentStatus;
import com.rishbootdev.mantu.common_library.exceptions.ResourceNotFoundException;
import com.rishbootdev.mantu.payment_service.dto.request.PaymentInitRequest;
import com.rishbootdev.mantu.payment_service.dto.response.PaymentResponse;
import com.rishbootdev.mantu.payment_service.entity.OrderRecord;
import com.rishbootdev.mantu.payment_service.entity.Payment;
import com.rishbootdev.mantu.payment_service.gateway.PaymentGatewayRouter;
import com.rishbootdev.mantu.payment_service.gateway.dto.PaymentRequest;
import com.rishbootdev.mantu.payment_service.gateway.dto.PaymentResult;
import com.rishbootdev.mantu.payment_service.client.dto.FraudPredictionResponse;
import com.rishbootdev.mantu.payment_service.config.FraudDetectionProperties;
import com.rishbootdev.mantu.payment_service.mapper.PaymentMapper;
import com.rishbootdev.mantu.payment_service.outbox.OutboxEventPublisher;
import com.rishbootdev.mantu.payment_service.repository.OrderRepository;
import com.rishbootdev.mantu.payment_service.repository.PaymentRepository;
import com.rishbootdev.mantu.payment_service.saga.PaymentAuthorizationRecorder;
import com.rishbootdev.mantu.payment_service.service.PaymentService;
import com.rishbootdev.mantu.payment_service.service.FraudScreeningService;
import com.rishbootdev.mantu.payment_service.service.SmartRoutingService;
import com.rishbootdev.mantu.payment_service.statemachine.PaymentTransitionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentGatewayRouter paymentGatewayRouter;
    private final PaymentMapper paymentMapper;
    private final PaymentTransitionService paymentTransitionService;
    private final OutboxEventPublisher eventPublisher;
    private final PaymentAuthorizationRecorder paymentAuthorizationRecorder;
    private final FraudScreeningService fraudScreeningService;
    private final FraudDetectionProperties fraudDetectionProperties;
    private final SmartRoutingService smartRoutingService;
    @Override
    public PaymentResponse initiate(UUID merchantId, PaymentInitRequest request, String idempotencyKey) {

        if(idempotencyKey != null){
            var existing = paymentAuthorizationRecorder.findExistingAttempt(merchantId, idempotencyKey);
            if(existing.isPresent()){
                log.info("Idempotency replay for paymentId: {}", existing.get().id());
                return existing.get();
            }
        }

        Payment payment = paymentAuthorizationRecorder.recordPayment(merchantId, request, idempotencyKey);

        payment = paymentRepository.save(payment);

        FraudPredictionResponse fraudPrediction = fraudScreeningService.screen(payment);
        if (fraudPrediction != null) {
            payment.setFraudProbability(fraudPrediction.fraudProbability());
            payment.setFraudRiskLevel(fraudPrediction.riskLevel());
            payment.setFraudModelVersion(fraudPrediction.modelVersion());
            payment.setFraudPlaceholder(fraudPrediction.placeholder());
            payment = paymentRepository.save(payment);
        }
        if (fraudDetectionProperties.getEnforcementMode()
                == FraudDetectionProperties.EnforcementMode.BLOCK_HIGH_RISK
                && fraudPrediction != null
                && fraudPrediction.isHighRisk()) {
            log.warn("Payment blocked by fraud policy paymentId={}, probability={}",
                    payment.getId(), fraudPrediction.fraudProbability());
            return paymentAuthorizationRecorder.compensateAuthorizationFailure(
                    payment.getId(),
                    "FRAUD_HIGH_RISK",
                    "Payment blocked by configured fraud policy."
            );
        }

        SmartRoutingService.RoutingDecision routingDecision = smartRoutingService.recommendRoute(payment);
        String selectedRouteId = routingDecision.routeId();
        payment.setSelectedRouteId(selectedRouteId);
        payment.setRoutingModelVersion(routingDecision.modelVersion());
        payment.setRoutingPlaceholder(routingDecision.placeholder());
        payment = paymentRepository.save(payment);

        PaymentRequest paymentRequest = new PaymentRequest(
                payment.getId(),
                request.orderId(),
                merchantId,
                payment.getAmount(),
                request.method(),
                request.methodDetails(),
                selectedRouteId
        );

        PaymentResult result;
        try {
            result = paymentGatewayRouter.initiate(paymentRequest);
        }catch (Exception e) {
            return paymentAuthorizationRecorder.compensateAuthorizationFailure(payment.getId(),
                    "PAYMENT_GATEWAY_ROUTER_UNREACHABLE", e.getMessage());
        }

        return paymentAuthorizationRecorder.applyGatewayResult(payment.getId(), result);
    }

    @Override
    @Transactional
    public PaymentResponse capture(UUID merchantId, UUID paymentId) {

                                                                                          
                                                                                          
        Payment payment = paymentRepository.findByIdAndMerchantIdForUpdate(paymentId, merchantId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));

        paymentTransitionService.apply(payment, PaymentEvent.CAPTURE_REQUEST);

        PaymentResult paymentResult = paymentGatewayRouter.capture(payment.getMethod(), paymentId);

        if(paymentResult instanceof PaymentResult.Success success) {
            paymentTransitionService.apply(payment, PaymentEvent.CAPTURE_SUCCESS);
            payment.setCapturedAt(LocalDateTime.now());
            log.info("Payment captured, paymentID: {}", paymentId);
        }else if (paymentResult instanceof PaymentResult.Failure failure) {
            paymentTransitionService.apply(payment, PaymentEvent.CAPTURE_FAIL);
            payment.setErrorCode(failure.errorCode());
            payment.setErrorDescription(failure.errorDescription());
            log.warn("Payment captured failed paymentID: {}", paymentId);
        }

        payment = paymentRepository.save(payment);

        publishPaymentStatusEvent(payment);

        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getById(UUID merchantId, UUID paymentId) {
        Payment payment = paymentRepository.findByIdAndMerchantId(paymentId, merchantId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));
        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> listByMerchantId(UUID merchantId) {
        return paymentMapper.toResponseList(
                paymentRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId)
        );
    }

    @Override
    @Transactional
    public void resolveAuthorization(UUID paymentId, boolean approve, String bankRef, String errorCode, String errorDescription) {

                                                                 
                                                                                          
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));

        if(payment.getStatus() != PaymentStatus.AUTHORIZING){
            log.warn("Payment is not in Authorizing state, paymentID: {}, status: {}", paymentId, payment.getStatus());
            return;
        }

        OrderRecord orderRecord = payment.getOrder();

        if(approve){
            paymentTransitionService.apply(payment, PaymentEvent.AUTHORIZE_SUCCESS);
            payment.setBankReference(bankRef);
            payment.setAuthorizedAt(LocalDateTime.now());

                          
            paymentTransitionService.apply(payment, PaymentEvent.CAPTURE_REQUEST);
            PaymentResult captureResult = paymentGatewayRouter.capture(payment.getMethod(), paymentId);

            if(captureResult instanceof PaymentResult.Success success){
                paymentTransitionService.apply(payment, PaymentEvent.CAPTURE_SUCCESS);
                payment.setCapturedAt(LocalDateTime.now());
                orderRecord.setOrderStatus(OrderStatus.PAID);
            }else if(captureResult instanceof PaymentResult.Failure failure){
                paymentTransitionService.apply(payment, PaymentEvent.CAPTURE_FAIL);
                payment.setErrorCode(failure.errorCode());
                payment.setErrorDescription(failure.errorDescription());

            }

        }else{
            paymentTransitionService.apply(payment, PaymentEvent.AUTHORIZE_FAIL);
            payment.setErrorCode(errorCode);
            payment.setErrorDescription(errorDescription);
        }

        paymentRepository.save(payment);
        orderRepository.save(orderRecord);

        publishPaymentStatusEvent(payment);


    }

    private void publishPaymentStatusEvent(Payment payment) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("orderId", payment.getOrder().getId().toString());
        payload.put("paymentId", payment.getId().toString());
        payload.put("merchantId", payment.getMerchantId().toString());
        payload.put("paymentStatus", payment.getStatus().name());
        payload.put("amountUnits", payment.getAmount().getAmountUnits());
        payload.put("amountCurrency", payment.getAmount().getCurrency());
        payload.put("paymentMethod", payment.getMethod().name());
        payload.put("selectedRouteId", payment.getSelectedRouteId());
        payload.put("errorCode", payment.getErrorCode());
        eventPublisher.publish(EventAggregateType.PAYMENT, payment.getId(), "PAYMENT_STATUS_CHANGED", payload);
    }
}
