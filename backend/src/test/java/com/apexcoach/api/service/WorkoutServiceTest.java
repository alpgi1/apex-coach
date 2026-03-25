package com.apexcoach.api.service;

import com.apexcoach.api.dto.request.CreateExerciseLogRequest;
import com.apexcoach.api.dto.request.CreateWorkoutRequest;
import com.apexcoach.api.dto.request.CreateWorkoutSetRequest;
import com.apexcoach.api.entity.*;
import com.apexcoach.api.entity.enums.EquipmentType;
import com.apexcoach.api.entity.enums.ExerciseCategory;
import com.apexcoach.api.entity.enums.MuscleGroup;
import com.apexcoach.api.entity.enums.SetType;
import com.apexcoach.api.exception.ResourceNotFoundException;
import com.apexcoach.api.repository.ExerciseRepository;
import com.apexcoach.api.repository.WorkoutSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkoutServiceTest {

    @Mock private WorkoutSessionRepository workoutSessionRepository;
    @Mock private ExerciseRepository exerciseRepository;
    @Mock private AuthenticatedUserService authenticatedUserService;

    @InjectMocks private WorkoutService workoutService;

    private User user;
    private Exercise exercise;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(UUID.randomUUID())
                .supabaseId("sup-123")
                .email("test@example.com")
                .name("Test User")
                .build();

        exercise = Exercise.builder()
                .id(UUID.randomUUID())
                .name("Bench Press")
                .primaryMuscleGroup(MuscleGroup.CHEST)
                .equipment(EquipmentType.BARBELL)
                .category(ExerciseCategory.COMPOUND)
                .build();
    }

    // ── Volume calculation ───────────────────────────────────────────────────

    @Test
    void create_computesVolume_fromCompletedWorkingSetsOnly() {
        // Given: 2 working completed sets + 1 warmup set (should be excluded)
        CreateWorkoutSetRequest workingSet1 = workingSet(1, "100", 5, true);
        CreateWorkoutSetRequest workingSet2 = workingSet(2, "100", 5, true);
        CreateWorkoutSetRequest warmupSet   = warmupSet(3, "60", 10, true);

        CreateWorkoutRequest request = buildRequest(List.of(workingSet1, workingSet2, warmupSet));

        when(authenticatedUserService.getCurrentUser()).thenReturn(user);
        when(exerciseRepository.findById(exercise.getId())).thenReturn(Optional.of(exercise));
        when(workoutSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // When
        workoutService.create(request);

        // Then: volume = (100 × 5) + (100 × 5) = 1000 kg; warmup excluded
        ArgumentCaptor<WorkoutSession> captor = ArgumentCaptor.forClass(WorkoutSession.class);
        verify(workoutSessionRepository).save(captor.capture());
        assertThat(captor.getValue().getVolumeKg()).isEqualByComparingTo("1000");
    }

    @Test
    void create_excludesIncompleteSets_fromVolumeCalculation() {
        // Given: 1 completed + 1 incomplete working set
        CreateWorkoutSetRequest completed   = workingSet(1, "80", 8, true);
        CreateWorkoutSetRequest incomplete  = workingSet(2, "80", 8, false);

        CreateWorkoutRequest request = buildRequest(List.of(completed, incomplete));

        when(authenticatedUserService.getCurrentUser()).thenReturn(user);
        when(exerciseRepository.findById(exercise.getId())).thenReturn(Optional.of(exercise));
        when(workoutSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // When
        workoutService.create(request);

        // Then: only completed set counts — 80 × 8 = 640
        ArgumentCaptor<WorkoutSession> captor = ArgumentCaptor.forClass(WorkoutSession.class);
        verify(workoutSessionRepository).save(captor.capture());
        assertThat(captor.getValue().getVolumeKg()).isEqualByComparingTo("640");
    }

    // ── RPE calculation ──────────────────────────────────────────────────────

    @Test
    void create_setsAverageRpeToNull_whenNoRpeIsProvided() {
        CreateWorkoutSetRequest setNoRpe = new CreateWorkoutSetRequest(1, new BigDecimal("100"), 5, null, SetType.WORKING, null, true);
        CreateWorkoutRequest request = buildRequest(List.of(setNoRpe));

        when(authenticatedUserService.getCurrentUser()).thenReturn(user);
        when(exerciseRepository.findById(exercise.getId())).thenReturn(Optional.of(exercise));
        when(workoutSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        workoutService.create(request);

        ArgumentCaptor<WorkoutSession> captor = ArgumentCaptor.forClass(WorkoutSession.class);
        verify(workoutSessionRepository).save(captor.capture());
        assertThat(captor.getValue().getAverageRpe()).isNull();
    }

    @Test
    void create_computesAverageRpe_roundedToOneDecimal() {
        // Given: RPE 8 and RPE 9 → average = 8.5
        CreateWorkoutSetRequest set1 = new CreateWorkoutSetRequest(1, new BigDecimal("100"), 5, new BigDecimal("8"), SetType.WORKING, null, true);
        CreateWorkoutSetRequest set2 = new CreateWorkoutSetRequest(2, new BigDecimal("100"), 5, new BigDecimal("9"), SetType.WORKING, null, true);
        CreateWorkoutRequest request = buildRequest(List.of(set1, set2));

        when(authenticatedUserService.getCurrentUser()).thenReturn(user);
        when(exerciseRepository.findById(exercise.getId())).thenReturn(Optional.of(exercise));
        when(workoutSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        workoutService.create(request);

        ArgumentCaptor<WorkoutSession> captor = ArgumentCaptor.forClass(WorkoutSession.class);
        verify(workoutSessionRepository).save(captor.capture());
        assertThat(captor.getValue().getAverageRpe()).isEqualByComparingTo("8.5");
    }

    // ── Error paths ──────────────────────────────────────────────────────────

    @Test
    void create_throws_whenExerciseDoesNotExist() {
        CreateWorkoutSetRequest set = workingSet(1, "100", 5, true);
        CreateWorkoutRequest request = buildRequest(List.of(set));

        when(authenticatedUserService.getCurrentUser()).thenReturn(user);
        when(exerciseRepository.findById(exercise.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workoutService.create(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Exercise");
    }

    @Test
    void getById_throws_whenSessionBelongsToAnotherUser() {
        // Given: session owned by a different user
        User otherUser = User.builder().id(UUID.randomUUID()).build();
        WorkoutSession session = WorkoutSession.builder()
                .id(UUID.randomUUID())
                .user(otherUser)
                .name("Other's workout")
                .startTime(Instant.now())
                .build();

        when(authenticatedUserService.getCurrentUser()).thenReturn(user);
        when(workoutSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> workoutService.getById(session.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_throws_whenSessionBelongsToAnotherUser() {
        User otherUser = User.builder().id(UUID.randomUUID()).build();
        WorkoutSession session = WorkoutSession.builder()
                .id(UUID.randomUUID())
                .user(otherUser)
                .name("Other's workout")
                .startTime(Instant.now())
                .build();

        when(authenticatedUserService.getCurrentUser()).thenReturn(user);
        when(workoutSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> workoutService.delete(session.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(workoutSessionRepository, never()).delete(any());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private CreateWorkoutSetRequest workingSet(int num, String weight, int reps, boolean completed) {
        return new CreateWorkoutSetRequest(num, new BigDecimal(weight), reps, null, SetType.WORKING, null, completed);
    }

    private CreateWorkoutSetRequest warmupSet(int num, String weight, int reps, boolean completed) {
        return new CreateWorkoutSetRequest(num, new BigDecimal(weight), reps, null, SetType.WARMUP, null, completed);
    }

    private CreateWorkoutRequest buildRequest(List<CreateWorkoutSetRequest> sets) {
        CreateExerciseLogRequest log = new CreateExerciseLogRequest(exercise.getId(), 0, null, sets);
        return new CreateWorkoutRequest("Push Day", Instant.now(), null, null, null, List.of(log));
    }
}
