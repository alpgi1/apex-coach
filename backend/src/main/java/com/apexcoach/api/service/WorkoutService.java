package com.apexcoach.api.service;

import com.apexcoach.api.dto.request.CreateExerciseLogRequest;
import com.apexcoach.api.dto.request.CreateWorkoutRequest;
import com.apexcoach.api.dto.request.CreateWorkoutSetRequest;
import com.apexcoach.api.dto.response.WorkoutResponse;
import com.apexcoach.api.entity.*;
import com.apexcoach.api.entity.enums.SetType;
import com.apexcoach.api.exception.ResourceNotFoundException;
import com.apexcoach.api.repository.ExerciseRepository;
import com.apexcoach.api.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkoutService {

    private final WorkoutSessionRepository workoutSessionRepository;
    private final ExerciseRepository exerciseRepository;
    private final AuthenticatedUserService authenticatedUserService;

    // ── CREATE ───────────────────────────────────────────────

    @Transactional
    public WorkoutResponse create(CreateWorkoutRequest request) {
        User user = authenticatedUserService.getCurrentUser();

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

    // ── READ (paginated list — user-scoped) ────────────────────

    public Page<WorkoutResponse> getAll(Pageable pageable) {
        User user = authenticatedUserService.getCurrentUser();
        return workoutSessionRepository.findByUserOrderByStartTimeDesc(user, pageable)
                .map(WorkoutResponse::from);
    }

    // ── READ (single — ownership check) ────────────────────────

    public WorkoutResponse getById(java.util.UUID id) {
        User user = authenticatedUserService.getCurrentUser();
        WorkoutSession session = workoutSessionRepository.findById(id)
                .filter(s -> s.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("WorkoutSession", "id", id));
        return WorkoutResponse.from(session);
    }

    // ── DELETE (ownership check) ───────────────────────────────

    @Transactional
    public void delete(java.util.UUID id) {
        User user = authenticatedUserService.getCurrentUser();
        WorkoutSession session = workoutSessionRepository.findById(id)
                .filter(s -> s.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("WorkoutSession", "id", id));
        workoutSessionRepository.delete(session);
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
