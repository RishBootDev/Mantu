package com.rishbootdev.mantu.common_library.dto;

import java.util.UUID;

public record WebhookTarget(UUID configId, String targetUrl, String webhookSecret) {
}
