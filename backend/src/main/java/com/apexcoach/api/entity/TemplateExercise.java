package com.apexcoach.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "template_exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private WorkoutTemplate template;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(name = "target_sets", nullable = false)
    @Builder.Default
    private int targetSets = 3;

    @Column(name = "target_reps_min", nullable = false)
    @Builder.Default
    private int targetRepsMin = 6;

    @Column(name = "target_reps_max")
    private Integer targetRepsMax;

    @Column(name = "target_rpe", precision = 3, scale = 1)
    private BigDecimal targetRpe;

    @Column(name = "rest_target_seconds")
    private Integer restTargetSeconds;

    @Column(name = "target_weight_kg", precision = 6, scale = 2)
    private BigDecimal targetWeightKg;
}
