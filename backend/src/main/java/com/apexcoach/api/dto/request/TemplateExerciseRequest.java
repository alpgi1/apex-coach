package com.apexcoach.api.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record TemplateExerciseRequest(

        @NotNull(message = "Exercise ID is required")
        UUID exerciseId,

        @Min(value = 0, message = "Sort order must be >= 0")
        int sortOrder,

        @Min(value = 1, message = "Target sets must be >= 1")
        int targetSets,

        @Min(value = 1, message = "Target reps min must be >= 1")
        int targetRepsMin,

        Integer targetRepsMax,

        @DecimalMin(value = "5.0", message = "RPE must be >= 5.0")
        @DecimalMax(value = "10.0", message = "RPE must be <= 10.0")
        BigDecimal targetRpe,

        @Min(value = 0, message = "Rest target must be >= 0")
        Integer restTargetSeconds,

        @DecimalMin(value = "0.0", message = "Weight must be >= 0")
        BigDecimal targetWeightKg
) {}
