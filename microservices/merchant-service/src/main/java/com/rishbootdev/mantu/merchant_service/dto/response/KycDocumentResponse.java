package com.rishbootdev.mantu.merchant_service.dto.response;

import com.rishbootdev.mantu.merchant_service.kyc.KycDocumentType;

import java.util.UUID;

public record KycDocumentResponse(UUID id, KycDocumentType documentType, String filename, String contentType, long sizeBytes) {
}
