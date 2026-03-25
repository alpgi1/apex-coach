package com.apexcoach.api.service;

import com.apexcoach.api.dto.response.PersonalRecordResponse;
import com.apexcoach.api.entity.*;
import com.apexcoach.api.entity.enums.EquipmentType;
import com.apexcoach.api.entity.enums.ExerciseCategory;
import com.apexcoach.api.entity.enums.MuscleGroup;
import com.apexcoach.api.entity.enums.SetType;
import com.apexcoach.api.exception.ResourceNotFoundException;
import com.apexcoach.api.repository.ExerciseRepository;
import com.apexcoach.api.repository.WorkoutSetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PersonalRecordServiceTest {

    @Mock private WorkoutSetRepository workoutSetRepository;
    @Mock private ExerciseRepository exerciseRepository;
    @Mock private AuthenticatedUserService authenticatedUserService;

    @InjectMocks private PersonalRecordService personalRecordService;

    private User user;
    private Exercise exercise;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(UUID.randomUUID())
                .supabaseId("sup-456")
                .email("athlete@example.com")
                .name("Athlete")
                .build();

        exercise = Exercise.builder()
                .id(UUID.randomUUID())
                .name("Squat")
                .primaryMuscleGroup(MuscleGroup.LEGS)
                .equipment(EquipmentType.BARBELL)
                .category(ExerciseCategory.COMPOUND)
                .build();
    }

    @Test
    void getForExercise_throws_whenExerciseNotFound() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(user);
        when(exerciseRepository.findById(exercise.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> personalRecordService.getForExercise(exercise.getId()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Exercise");
    }

    @Test
    void getForExercise_returnsEmptyRecord_whenUserHasNoSets() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(user);
        when(exerciseRepository.findById(exercise.getId())).thenReturn(Optional.of(exercise));
        when(workoutSetRepository.findByExerciseLogExerciseIdAndExerciseLogSessionUser(exercise.getId(), user))
                .thenReturn(List.of());

        PersonalRecordResponse response = personalRecordService.getForExercise(exercise.getId());

        assertThat(response.maxWeightKg()).isNull();
        assertThat(response.repsAtMaxWeight()).isNull();
        assertThat(response.estimated1rm()).isNull();
    }

    @Test
    void getForExercise_selectsBestSetByEpley_notRawWeight() {
        // Epley formula: weight × (1 + reps / 30)
        // Set A: 90 kg × 5 reps  → 90 × (1 + 5/30) = 90 × 1.1667 = 105.0
        // Set B: 80 kg × 10 reps → 80 × (1 + 10/30) = 80 × 1.3333 = 106.67  ← wins
        WorkoutSet setA = buildWorkingSet(new BigDecimal("90"), 5);
        WorkoutSet setB = buildWorkingSet(new BigDecimal("80"), 10);

        when(authenticatedUserService.getCurrentUser()).thenReturn(user);
        when(exerciseRepository.findById(exercise.getId())).thenReturn(Optional.of(exercise));
        when(workoutSetRepository.findByExerciseLogExerciseIdAndExerciseLogSessionUser(exercise.getId(), user))
                .thenReturn(List.of(setA, setB));

        PersonalRecordResponse response = personalRecordService.getForExercise(exercise.getId());

        // Set B has higher estimated 1RM even though Set A has higher raw weight
        assertThat(response.maxWeightKg()).isEqualByComparingTo("80");
        assertThat(response.repsAtMaxWeight()).isEqualTo(10);
    }

    @Test
    void getForExercise_calculatesEstimated1rm_usingEpleyFormula() {
        // 100 kg × 10 reps → 100 × (1 + 10/30) = 133.33
        WorkoutSet set = buildWorkingSet(new BigDecimal("100"), 10);

        when(authenticatedUserService.getCurrentUser()).thenReturn(user);
        when(exerciseRepository.findById(exercise.getId())).thenReturn(Optional.of(exercise));
        when(workoutSetRepository.findByExerciseLogExerciseIdAndExerciseLogSessionUser(exercise.getId(), user))
                .thenReturn(List.of(set));

        PersonalRecordResponse response = personalRecordService.getForExercise(exercise.getId());

        assertThat(response.estimated1rm()).isEqualByComparingTo("133.33");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private WorkoutSet buildWorkingSet(BigDecimal weight, int reps) {
        ExerciseLog log = ExerciseLog.builder()
                .exercise(exercise)
                .session(WorkoutSession.builder().user(user).build())
                .build();

        return WorkoutSet.builder()
                .weightKg(weight)
                .reps(reps)
                .setType(SetType.WORKING)
                .isCompleted(true)
                .exerciseLog(log)
                .build();
    }
}
