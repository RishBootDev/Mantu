package com.rishbootdev.mantu.api_gateway.security;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtAuthHandler {

    private final JwtVerifier jwtVerifier;

    public Map<String, String> authenticate(String token) {
        Claims claims;
        try {
            claims = jwtVerifier.verify(token);
        }catch (Exception e){
            throw new GatewayAuthenticationException("Invalid or Expired token");
        }

        Map<String, String> headers = new LinkedHashMap<>();
        String merchantId = jwtVerifier.extractMerchantId(claims);
        if (merchantId != null && !merchantId.isBlank()) {
            headers.put("X-Merchant-Id", merchantId);
        }
        headers.put("X-User-Role", jwtVerifier.extractRole(claims));
        return headers;
    }

}
