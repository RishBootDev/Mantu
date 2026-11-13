package com.rishbootdev.mantu.payment_service.processor.strategy;

import com.rishbootdev.mantu.common_library.dto.PaymentProcessorRequest;
import com.rishbootdev.mantu.common_library.dto.PaymentProcessorResponse;
import com.rishbootdev.mantu.common_library.util.RandomizerUtil;
import com.rishbootdev.mantu.payment_service.processor.PaymentProcessor;
import org.springframework.stereotype.Component;

@Component
public class NetBankingPaymentProcessor implements PaymentProcessor {
    @Override
    public PaymentProcessorResponse charge(PaymentProcessorRequest request) {

        final String BANK_CODE_FAIL = "BANK_CODE_FAIL";

        String bankCode = request.methodDetails() != null ?
                request.methodDetails().get("bank").toString() : null;
        // simulation
        if(BANK_CODE_FAIL.equals(bankCode)){
            return new PaymentProcessorResponse.Failure("BANK_REJECTED", "Bank rejected the transaction registration");
        }

        String processorRef = "NBK_PROCESSOR"+ RandomizerUtil.randomBase64(16);

//        String redirectRef = "http:REDIRECT_BANK.com/"+processorRef;

        return new PaymentProcessorResponse.Pending(processorRef);
    }
}
