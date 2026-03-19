package com.apexcoach.api.service;

import com.apexcoach.api.dto.request.CreateExerciseLogRequest;
import com.apexcoach.api.dto.request.CreateWorkoutRequest;
import com.apexcoach.api.dto.request.CreateWorkoutSetRequest;
import com.apexcoach.api.dto.response.WorkoutResponse;
import com.apexcoach.api.entity.*;
import com.apexcoach.api.entity.enums.SetType;
import com.apexcoach.api.exception.ResourceNotFoundException;
import com.apexcoach.api.repository.ExerciseRepository;
import com.apexcoach.api.repository.UserRepository;
import com.apexcoach.api.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkoutService {

    // TODO: Replace with authenticated user from SecurityContext (Adım 6)
    private static final UUID DEV_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final WorkoutSessionRepository workoutSessionRepository;
    private final ExerciseRepository exerciseRepository;
    private final UserRepository userRepository;

    // ── CREATE ───────────────────────────────────────────────

    @Transactional
    public WorkoutResponse create(CreateWorkoutRequest request) {
        User user = userRepository.findById(DEV_USER_ID)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", DEV_USER_ID));

        WorkoutSession session = WorkoutSession.builder()
                .user(user)
                .name(request.name())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .bodyweightKg(request.bodyweightKg())
                .notes(request.notes())
                .build();

        for (CreateExerciseLogRequest logReq : request.logs()) {
            Exercise exercise = exerciseRepository.findById(logReq.exerciseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Exercise", "id", logReq.exerciseId()));

            ExerciseLog log = ExerciseLog.builder()
                    .session(session)
                    .exercise(exercise)
                    .sortOrder(logReq.order())
                    .notes(logReq.notes())
                    .build();

            for (CreateWorkoutSetRequest setReq : logReq.sets()) {
                WorkoutSet set = WorkoutSet.builder()
                        .exerciseLog(log)
                        .setNumber(setReq.setNumber())
                        .weightKg(setReq.weightKg())
                        .reps(setReq.reps())
                        .rpe(setReq.rpe())
                        .setType(setReq.setType())
                        .restDurationSeconds(setReq.restDurationSeconds())
                        .isCompleted(setReq.isCompleted())
                        .build();
                log.getSets().add(set);
            }

            session.getLogs().add(log);
        }

        computeVolume(session);
        computeAverageRpe(session);

        WorkoutSession saved = workoutSessionRepository.save(session);
        return WorkoutResponse.from(saved);
    }

    // ── READ (paginated list) ────────────────────────────────

    public Page<WorkoutResponse> getAll(Pageable pageable) {
        return workoutSessionRepository.findAllByOrderByStartTimeDesc(pageable)
                .map(WorkoutResponse::from);
    }

    // ── READ (single) ────────────────────────────────────────

    public WorkoutResponse getById(UUID id) {
        WorkoutSession session = workoutSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkoutSession", "id", id));
        return WorkoutResponse.from(session);
    }

    // ── DELETE ───────────────────────────────────────────────

    @Transactional
    public void delete(UUID id) {
        if (!workoutSessionRepository.existsById(id)) {
            throw new ResourceNotFoundException("WorkoutSession", "id", id);
        }
        workoutSessionRepository.deleteById(id);
    }

    // ── PRIVATE HELPERS ─────────────────────────────────────

    private void computeVolume(WorkoutSession session) {
        BigDecimal total = session.getLogs().stream()
                .flatMap(log -> log.getSets().stream())
                .filter(s -> s.getSetType() == SetType.WORKING && s.isCompleted())
                .map(s -> s.getWeightKg().multiply(BigDecimal.valueOf(s.getReps())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        session.setVolumeKg(total);
    }

    private void computeAverageRpe(WorkoutSession session) {
        List<BigDecimal> rpeValues = session.getLogs().stream()
                .flatMap(log -> log.getSets().stream())
                .filter(s -> s.getSetType() == SetType.WORKING && s.isCompleted() && s.getRpe() != null)
                .map(WorkoutSet::getRpe)
                .toList();

        if (rpeValues.isEmpty()) {
            session.setAverageRpe(null);
            return;
        }

        BigDecimal sum = rpeValues.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal avg = sum.divide(BigDecimal.valueOf(rpeValues.size()), 1, RoundingMode.HALF_UP);
        session.setAverageRpe(avg);
    }
}
