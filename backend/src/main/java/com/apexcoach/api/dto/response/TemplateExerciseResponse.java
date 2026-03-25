package com.apexcoach.api.dto.response;

import com.apexcoach.api.entity.TemplateExercise;

import java.math.BigDecimal;
import java.util.UUID;

public record TemplateExerciseResponse(
        UUID id,
        UUID exerciseId,
        String exerciseName,
        int sortOrder,
        int targetSets,
        int targetRepsMin,
        Integer targetRepsMax,
        BigDecimal targetRpe,
        Integer restTargetSeconds,
        BigDecimal targetWeightKg
) {
    public static TemplateExerciseResponse from(TemplateExercise te) {
        return new TemplateExerciseResponse(
                te.getId(),
                te.getExercise().getId(),
                te.getExercise().getName(),
                te.getSortOrder(),
                te.getTargetSets(),
                te.getTargetRepsMin(),
                te.getTargetRepsMax(),
                te.getTargetRpe(),
                te.getRestTargetSeconds(),
                te.getTargetWeightKg()
        );
    }
}
