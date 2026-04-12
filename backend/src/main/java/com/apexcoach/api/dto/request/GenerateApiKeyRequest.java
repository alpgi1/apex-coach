package com.apexcoach.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GenerateApiKeyRequest(
        @NotBlank
        @Size(max = 100)
        String name
) {}
