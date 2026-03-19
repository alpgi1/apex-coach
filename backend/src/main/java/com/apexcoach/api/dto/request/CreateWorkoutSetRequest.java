package com.apexcoach.api.dto.request;

import com.apexcoach.api.entity.enums.SetType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CreateWorkoutSetRequest(

        @Min(value = 1, message = "Set number must be at least 1")
        int setNumber,

        @NotNull(message = "Weight is required")
        @DecimalMin(value = "0.0", message = "Weight must be >= 0")
        BigDecimal weightKg,

        @Min(value = 0, message = "Reps must be >= 0")
        int reps,

        @DecimalMin(value = "1.0", message = "RPE must be between 1 and 10")
        @DecimalMax(value = "10.0", message = "RPE must be between 1 and 10")
        BigDecimal rpe,

        @NotNull(message = "Set type is required")
        SetType setType,

        @Min(value = 0, message = "Rest duration must be >= 0")
        Integer restDurationSeconds,

        boolean isCompleted
) {}
