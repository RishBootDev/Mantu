package com.rishbootdev.mantu.common_library.audit;

import com.rishbootdev.mantu.common_library.context.MerchantContext;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.domain.AuditorAware;

@AutoConfiguration
public class SharedAuditAutoConfiguration {

    @Bean("auditorAwareImpl")
    public AuditorAware<String> auditorAwareImpl(MerchantContext merchantContext) {
        return new AuditorAwareImpl(merchantContext);
    }
}
