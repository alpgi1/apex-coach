package com.apexcoach.api.dto.response;

import com.apexcoach.api.entity.WorkoutTemplate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TemplateResponse(
        UUID id,
        String name,
        String description,
        List<String> primaryMuscleGroups,
        List<TemplateExerciseResponse> exercises,
        Instant createdAt,
        Instant updatedAt
) {
    public static TemplateResponse from(WorkoutTemplate t) {
        return new TemplateResponse(
                t.getId(),
                t.getName(),
                t.getDescription(),
                t.getPrimaryMuscleGroups(),
                t.getExercises().stream().map(TemplateExerciseResponse::from).toList(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
