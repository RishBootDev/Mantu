package com.rishbootdev.mantu.merchant_service.dto.response;


import com.rishbootdev.mantu.common_library.enums.Environment;

import java.util.UUID;

public record  ApiKeyCreateResponse(
        UUID id,
        String keyId,
        String keySecret,
        Environment environment
) {
}
