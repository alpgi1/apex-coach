package com.apexcoach.api.dto.response;

import com.apexcoach.api.entity.Exercise;
import com.apexcoach.api.entity.enums.EquipmentType;
import com.apexcoach.api.entity.enums.ExerciseCategory;
import com.apexcoach.api.entity.enums.MuscleGroup;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ExerciseResponse(
        UUID id,
        String name,
        MuscleGroup primaryMuscleGroup,
        List<String> primaryMuscles,
        List<String> secondaryMuscles,
        EquipmentType equipment,
        ExerciseCategory category,
        int idealRepsMin,
        int idealRepsMax,
        boolean isBilateral,
        String instructions,
        String videoUrl,
        String gifUrl,
        boolean isCustom,
        Instant createdAt
) {
    public static ExerciseResponse from(Exercise e) {
        return new ExerciseResponse(
                e.getId(),
                e.getName(),
                e.getPrimaryMuscleGroup(),
                e.getPrimaryMuscles(),
                e.getSecondaryMuscles(),
                e.getEquipment(),
                e.getCategory(),
                e.getIdealRepsMin(),
                e.getIdealRepsMax(),
                e.isBilateral(),
                e.getInstructions(),
                e.getVideoUrl(),
                e.getGifUrl(),
                e.isCustom(),
                e.getCreatedAt()
        );
    }
}
