package com.apexcoach.api.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record AiInsightsRequest(

        @Min(value = 1, message = "Day range must be at least 1")
        @Max(value = 90, message = "Day range must be at most 90")
        int dayRange
) {}
