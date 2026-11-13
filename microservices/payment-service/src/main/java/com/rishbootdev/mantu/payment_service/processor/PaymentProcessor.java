package com.rishbootdev.mantu.payment_service.processor;


import com.rishbootdev.mantu.common_library.dto.PaymentProcessorRequest;
import com.rishbootdev.mantu.common_library.dto.PaymentProcessorResponse;

public interface PaymentProcessor {

    PaymentProcessorResponse charge(PaymentProcessorRequest request);

}
