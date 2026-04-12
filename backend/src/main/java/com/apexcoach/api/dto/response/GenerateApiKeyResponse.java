package com.apexcoach.api.dto.response;

import java.time.Instant;
import java.util.UUID;

public record GenerateApiKeyResponse(
        UUID id,
        String name,
        String key,
        String keyPrefix,
        Instant createdAt
) {}
