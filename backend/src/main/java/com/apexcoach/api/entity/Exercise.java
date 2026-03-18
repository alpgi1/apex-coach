package com.apexcoach.api.entity;

import com.apexcoach.api.entity.enums.EquipmentType;
import com.apexcoach.api.entity.enums.ExerciseCategory;
import com.apexcoach.api.entity.enums.MuscleGroup;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "primary_muscle_group", nullable = false, columnDefinition = "muscle_group")
    private MuscleGroup primaryMuscleGroup;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "primary_muscles", columnDefinition = "text[]")
    @Builder.Default
    private List<String> primaryMuscles = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "secondary_muscles", columnDefinition = "text[]")
    @Builder.Default
    private List<String> secondaryMuscles = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "equipment_type")
    private EquipmentType equipment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "exercise_category")
    private ExerciseCategory category;

    @Column(name = "ideal_reps_min", nullable = false)
    @Builder.Default
    private int idealRepsMin = 6;

    @Column(name = "ideal_reps_max", nullable = false)
    @Builder.Default
    private int idealRepsMax = 12;

    @Column(name = "is_bilateral", nullable = false)
    @Builder.Default
    private boolean isBilateral = false;

    @Column(columnDefinition = "text")
    private String instructions;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "is_custom", nullable = false)
    @Builder.Default
    private boolean isCustom = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
