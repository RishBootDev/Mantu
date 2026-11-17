package com.rishbootdev.mantu.payment_service.client;

import com.rishbootdev.mantu.payment_service.client.dto.FraudPredictionRequest;
import com.rishbootdev.mantu.payment_service.client.dto.FraudPredictionResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@FeignClient(name = "ml-services", contextId = "fraudDetectionClient", path = "/api/v1/fraud")
public interface FraudDetectionClient {

    @PostMapping("/predict")
    FraudPredictionResponse predict(@RequestBody FraudPredictionRequest request);
}
