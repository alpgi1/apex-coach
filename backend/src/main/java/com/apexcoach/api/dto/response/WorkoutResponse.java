package com.apexcoach.api.dto.response;

import com.apexcoach.api.entity.WorkoutSession;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WorkoutResponse(
        UUID id,
        String name,
        Instant startTime,
        Instant endTime,
        BigDecimal volumeKg,
        BigDecimal bodyweightKg,
        String notes,
        BigDecimal averageRpe,
        List<ExerciseLogResponse> logs
) {
    public static WorkoutResponse from(WorkoutSession session) {
        return new WorkoutResponse(
                session.getId(),
                session.getName(),
                session.getStartTime(),
                session.getEndTime(),
                session.getVolumeKg(),
                session.getBodyweightKg(),
                session.getNotes(),
                session.getAverageRpe(),
                session.getLogs().stream().map(ExerciseLogResponse::from).toList()
        );
    }
}
