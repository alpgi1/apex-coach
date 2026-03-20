package com.apexcoach.api.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record PersonalRecordResponse(
        UUID exerciseId,
        String exerciseName,
        BigDecimal maxWeightKg,
        Integer repsAtMaxWeight,
        BigDecimal estimated1rm
) {}
