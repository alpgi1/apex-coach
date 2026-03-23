package com.apexcoach.api.dto.response;

import com.apexcoach.api.entity.BodyWeightLog;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BodyWeightLogResponse(
        UUID id,
        LocalDate date,
        BigDecimal weightKg,
        String notes
) {
    public static BodyWeightLogResponse from(BodyWeightLog log) {
        return new BodyWeightLogResponse(log.getId(), log.getDate(), log.getWeightKg(), log.getNotes());
    }
}
