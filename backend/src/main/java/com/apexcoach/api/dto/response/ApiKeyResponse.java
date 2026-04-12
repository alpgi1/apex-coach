package com.apexcoach.api.dto.response;

import java.time.Instant;
import java.util.UUID;

public record ApiKeyResponse(
        UUID id,
        String name,
        String keyPrefix,
        Boolean isActive,
        Instant lastUsedAt,
        Instant createdAt
) {}
