package com.rishbootdev.mantu.payment_service.client;

import com.rishbootdev.mantu.payment_service.client.dto.RoutingRecommendationRequest;
import com.rishbootdev.mantu.payment_service.client.dto.RoutingRecommendationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@FeignClient(name = "ml-services", contextId = "smartRoutingClient", path = "/api/v1/routing")
public interface SmartRoutingClient {

    @PostMapping("/recommend")
    RoutingRecommendationResponse recommend(@RequestBody RoutingRecommendationRequest request);
}
