package com.apexcoach.api.dto.response;

import com.apexcoach.api.entity.WorkoutSet;
import com.apexcoach.api.entity.enums.SetType;

import java.math.BigDecimal;
import java.util.UUID;

public record WorkoutSetResponse(
        UUID id,
        int setNumber,
        BigDecimal weightKg,
        int reps,
        BigDecimal rpe,
        SetType setType,
        Integer restDurationSeconds,
        boolean isCompleted
) {
    public static WorkoutSetResponse from(WorkoutSet s) {
        return new WorkoutSetResponse(
                s.getId(),
                s.getSetNumber(),
                s.getWeightKg(),
                s.getReps(),
                s.getRpe(),
                s.getSetType(),
                s.getRestDurationSeconds(),
                s.isCompleted()
        );
    }
}
