package com.apexcoach.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "personal_records",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "exercise_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "estimated_1rm", precision = 6, scale = 2)
    private BigDecimal estimated1rm;

    @Column(name = "max_weight_kg", precision = 6, scale = 2)
    private BigDecimal maxWeightKg;

    @Column(name = "reps_at_max_weight")
    private Integer repsAtMaxWeight;

    @Column(name = "max_reps")
    private Integer maxReps;

    @Column(name = "weight_at_max_reps_kg", precision = 6, scale = 2)
    private BigDecimal weightAtMaxRepsKg;

    @Column(name = "max_session_volume_kg", precision = 10, scale = 2)
    private BigDecimal maxSessionVolumeKg;

    @Column(name = "date_achieved")
    private Instant dateAchieved;
}
