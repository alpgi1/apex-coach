package com.apexcoach.api.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LogBodyWeightRequest(

        @NotNull(message = "Date is required")
        LocalDate date,

        @NotNull(message = "Weight is required")
        @DecimalMin(value = "1.0", message = "Weight must be at least 1 kg")
        @DecimalMax(value = "500.0", message = "Weight must be at most 500 kg")
        BigDecimal weightKg,

        String notes
) {}
