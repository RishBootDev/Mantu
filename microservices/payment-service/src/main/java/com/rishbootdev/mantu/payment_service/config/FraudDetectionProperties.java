package com.rishbootdev.mantu.payment_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "fraud.detection")
public class FraudDetectionProperties {

    private boolean enabled = true;
    private EnforcementMode enforcementMode = EnforcementMode.OBSERVE;
    private double amountDivisor = 1.0;

    public enum EnforcementMode {
        OBSERVE,
        BLOCK_HIGH_RISK
    }
}
