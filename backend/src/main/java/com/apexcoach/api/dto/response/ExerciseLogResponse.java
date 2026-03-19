package com.apexcoach.api.dto.response;

import com.apexcoach.api.entity.ExerciseLog;

import java.util.List;
import java.util.UUID;

public record ExerciseLogResponse(
        UUID id,
        UUID exerciseId,
        String exerciseName,
        int order,
        String notes,
        List<WorkoutSetResponse> sets
) {
    public static ExerciseLogResponse from(ExerciseLog log) {
        return new ExerciseLogResponse(
                log.getId(),
                log.getExercise().getId(),
                log.getExercise().getName(),
                log.getSortOrder(),
                log.getNotes(),
                log.getSets().stream().map(WorkoutSetResponse::from).toList()
        );
    }
}
