package com.rishbootdev.mantu.payment_service.processor.strategy;

import com.rishbootdev.mantu.common_library.dto.PaymentProcessorRequest;
import com.rishbootdev.mantu.common_library.dto.PaymentProcessorResponse;
import com.rishbootdev.mantu.common_library.util.RandomizerUtil;
import com.rishbootdev.mantu.payment_service.processor.PaymentProcessor;
import org.springframework.stereotype.Component;

@Component
public class UpiPaymentProcessor implements PaymentProcessor {
    @Override
    public PaymentProcessorResponse charge(PaymentProcessorRequest request) {
        final String VPA_CODE_FAIL = "fail@okaxis";

        String bankCode = request.methodDetails() != null ?
                request.methodDetails().get("vpa").toString() : null;
        // simulation
        if(VPA_CODE_FAIL.equals(bankCode)){
            return new PaymentProcessorResponse.Failure("UPI_REJECTED", "Bank rejected the transaction registration");
        }

        String processorRef = "UPI_PROCESSOR"+ RandomizerUtil.randomBase64(16);

//        String bankRef = "BANK_REF"+RandomizerUtil.randomBase64(16);

        return new PaymentProcessorResponse.Pending(processorRef);
    }
}
