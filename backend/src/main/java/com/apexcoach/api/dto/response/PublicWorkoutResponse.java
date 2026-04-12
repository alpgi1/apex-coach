package com.apexcoach.api.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PublicWorkoutResponse(
        UUID id,
        LocalDate date,
        Long durationMinutes,
        BigDecimal volumeKg
) {}
