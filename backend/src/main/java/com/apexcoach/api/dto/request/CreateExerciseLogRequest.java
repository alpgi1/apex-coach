package com.apexcoach.api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;
import java.util.UUID;

public record CreateExerciseLogRequest(

        @NotNull(message = "Exercise ID is required")
        UUID exerciseId,

        @Min(value = 0, message = "Order must be >= 0")
        int order,

        @Size(max = 2000, message = "Notes must be at most 2000 characters")
        String notes,

        @NotEmpty(message = "Each exercise must have at least one set")
        @Valid
        List<CreateWorkoutSetRequest> sets
) {}
