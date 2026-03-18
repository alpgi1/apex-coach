package com.apexcoach.api.entity;

import com.apexcoach.api.entity.enums.SetType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "workout_sets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutSet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_log_id", nullable = false)
    private ExerciseLog exerciseLog;

    @Column(name = "set_number", nullable = false)
    private int setNumber;

    @Column(name = "weight_kg", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal weightKg = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private int reps = 0;

    @Column(precision = 3, scale = 1)
    private BigDecimal rpe;

    @Enumerated(EnumType.STRING)
    @Column(name = "set_type", nullable = false, columnDefinition = "set_type")
    @Builder.Default
    private SetType setType = SetType.WORKING;

    @Column(name = "rest_duration_seconds")
    private Integer restDurationSeconds;

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private boolean isCompleted = false;
}
