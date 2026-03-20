package com.apexcoach.api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateTemplateRequest(

        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description,

        List<String> primaryMuscleGroups,

        @NotEmpty(message = "Template must have at least one exercise")
        @Valid
        List<TemplateExerciseRequest> exercises
) {}
