package com.rishbootdev.mantu.merchant_service.kyc;

import com.rishbootdev.mantu.common_library.exceptions.BusinessRuleViolationException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;


@Component
@RequiredArgsConstructor
public class LocalKycDocumentStorage implements KycDocumentStorage {

    private final KycProperties properties;

    @Override
    public String store(String merchantId, MultipartFile document) {
        try {
            Path root = Path.of(properties.getStorageRoot()).toAbsolutePath().normalize();
            Path merchantDirectory = root.resolve(merchantId).normalize();
            if (!merchantDirectory.startsWith(root)) {
                throw new BusinessRuleViolationException("Invalid KYC document location", "KYC_DOCUMENT_INVALID");
            }
            Files.createDirectories(merchantDirectory);
            String key = merchantId + "/" + UUID.randomUUID();
            Files.copy(document.getInputStream(), root.resolve(key));
            return key;
        } catch (IOException exception) {
            throw new BusinessRuleViolationException("Unable to securely store KYC document", "KYC_DOCUMENT_STORE_FAILED");
        }
    }

    @Override
    public Resource load(String storageKey) {
        Path root = Path.of(properties.getStorageRoot()).toAbsolutePath().normalize();
        Path location = root.resolve(storageKey).normalize();
        if (!location.startsWith(root) || !Files.isRegularFile(location)) {
            throw new BusinessRuleViolationException("KYC document is unavailable", "KYC_DOCUMENT_NOT_FOUND");
        }
        return new FileSystemResource(location);
    }
}
