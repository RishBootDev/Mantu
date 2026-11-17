package com.rishbootdev.mantu.merchant_service.kyc;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Set;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "kyc")
public class KycProperties {
    private String storageRoot = "./data/kyc-documents";
    private String reviewMailbox;
    private String reviewBaseUrl = "http://localhost:8080";
    private Duration reviewerLinkTtl = Duration.ofDays(7);
    private long maxDocumentBytes = 10 * 1024 * 1024;
    private Set<String> allowedContentTypes = Set.of("application/pdf", "image/jpeg", "image/png");
}
