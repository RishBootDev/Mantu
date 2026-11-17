package com.rishbootdev.mantu.merchant_service.kyc;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface KycDocumentStorage {
    String store(String merchantId, MultipartFile document);
    Resource load(String storageKey);
}
