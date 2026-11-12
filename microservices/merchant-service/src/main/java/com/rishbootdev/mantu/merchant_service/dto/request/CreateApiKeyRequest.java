package com.rishbootdev.mantu.merchant_service.dto.request;


import com.rishbootdev.mantu.common_library.enums.Environment;

public record CreateApiKeyRequest(

        Environment environment
) {
}
