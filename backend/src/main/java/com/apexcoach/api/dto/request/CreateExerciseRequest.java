package com.apexcoach.api.dto.request;

import com.apexcoach.api.entity.enums.EquipmentType;
import com.apexcoach.api.entity.enums.ExerciseCategory;
import com.apexcoach.api.entity.enums.MuscleGroup;
import jakarta.validation.constraints.*;

import java.util.List;

public record CreateExerciseRequest(

        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        String name,

        @NotNull(message = "Primary muscle group is required")
        MuscleGroup primaryMuscleGroup,

        List<String> primaryMuscles,

        List<String> secondaryMuscles,

        @NotNull(message = "Equipment type is required")
        EquipmentType equipment,

        @NotNull(message = "Category is required")
        ExerciseCategory category,

        @Min(value = 1, message = "Ideal reps min must be at least 1")
        @Max(value = 100, message = "Ideal reps min must be at most 100")
        int idealRepsMin,

        @Min(value = 1, message = "Ideal reps max must be at least 1")
        @Max(value = 100, message = "Ideal reps max must be at most 100")
        int idealRepsMax,

        Boolean isBilateral,

        @Size(max = 2000, message = "Instructions must be at most 2000 characters")
        String instructions,

        String videoUrl
) {}
