package com.apexcoach.api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CreateWorkoutRequest(

        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        @NotNull(message = "Start time is required")
        Instant startTime,

        Instant endTime,

        @DecimalMin(value = "0.0", message = "Bodyweight must be >= 0")
        BigDecimal bodyweightKg,

        @Size(max = 2000, message = "Notes must be at most 2000 characters")
        String notes,

        @NotEmpty(message = "Workout must have at least one exercise")
        @Valid
        List<CreateExerciseLogRequest> logs
) {}
