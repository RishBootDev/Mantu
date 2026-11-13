package com.rishbootdev.mantu.payment_service.gateway.adapter;


import com.rishbootdev.mantu.common_library.dto.PaymentProcessorRequest;
import com.rishbootdev.mantu.common_library.dto.PaymentProcessorResponse;
import com.rishbootdev.mantu.common_library.enums.PaymentMethod;
import com.rishbootdev.mantu.payment_service.gateway.PaymentAdapter;
import com.rishbootdev.mantu.payment_service.gateway.dto.PaymentRequest;
import com.rishbootdev.mantu.payment_service.gateway.dto.PaymentResult;
import com.rishbootdev.mantu.payment_service.processor.PaymentProcessorRouter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class UpiPaymentAdapter implements PaymentAdapter {

    private final PaymentProcessorRouter paymentProcessorRouter;

    @Override
    public PaymentResult initiate(PaymentRequest request){

        log.info("Initiate Payment for UPI, paymentId: {}", request.paymentId());
        try{
            PaymentProcessorRequest paymentProcessorRequest = PaymentProcessorRequest.noncard(
                    request.paymentId(),
                    PaymentMethod.UPI,
                    request.amount(),
                    request.methodDetails()
            );

            PaymentProcessorResponse paymentProcessorResponse =
                    paymentProcessorRouter.charge(paymentProcessorRequest);



            return switch(paymentProcessorResponse){
                case PaymentProcessorResponse.Failure failure ->
                        new PaymentResult.Failure(failure.errorCode(), failure.errorDescription());

                case PaymentProcessorResponse.Pending pending ->
                        new PaymentResult.Pending(pending.processorReference());

                case PaymentProcessorResponse.Success success ->
                        new PaymentResult.Success(success.bankReference());
            };
        } catch (Exception e){
            log.warn("UPI failed, paymentId: {}", request.paymentId());
            return new PaymentResult.Failure("UPI_FAILED", e.getMessage());
        }

    }

    @Override
    public PaymentResult capture(UUID paymentId) {
        return new PaymentResult.Success("UPI_REF");
    }
}
