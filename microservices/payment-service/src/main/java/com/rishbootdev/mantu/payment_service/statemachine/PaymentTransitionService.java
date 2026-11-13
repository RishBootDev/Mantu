package com.rishbootdev.mantu.payment_service.statemachine;


import com.rishbootdev.mantu.common_library.context.MerchantContext;
import com.rishbootdev.mantu.common_library.enums.PaymentActor;
import com.rishbootdev.mantu.common_library.enums.PaymentEvent;
import com.rishbootdev.mantu.common_library.enums.PaymentStatus;
import com.rishbootdev.mantu.payment_service.entity.Payment;
import com.rishbootdev.mantu.payment_service.entity.PaymentTransitionLog;
import com.rishbootdev.mantu.payment_service.repository.PaymentTransitionLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentTransitionService {

    private final PaymentTransitionLogRepository paymentTransitionLogRepository;
    private final PaymentStateMachine paymentStateMachine;
    private final MerchantContext merchantContext;

    public PaymentStatus apply(Payment payment, PaymentEvent event){

        PaymentStatus next = paymentStateMachine.transition(payment.getStatus(), event);


        PaymentActor actor = getPaymentActor();

        PaymentTransitionLog log = PaymentTransitionLog.builder()
                .payment(payment)
                .fromStatus(payment.getStatus())
                .event(event)
                .toStatus(next)
                .actor(actor)
                .occurredAt(LocalDateTime.now())
                .build();
        payment.setStatus(next);

        paymentTransitionLogRepository.save(log);

        return next;

    }

    private PaymentActor getPaymentActor() {
        try {
            String keyId = merchantContext.getKeyId();
            UUID merchantId = merchantContext.getMerchantId();

            if(keyId != null && !keyId.isBlank()){
                return PaymentActor.CUSTOMER;
            } else if (merchantId != null) {
                return PaymentActor.MERCHANT;
            }
        } catch (Exception ignored) {
        }
        return PaymentActor.SYSTEM;
    }

}
