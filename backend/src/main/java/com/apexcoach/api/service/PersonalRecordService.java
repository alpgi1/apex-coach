package com.apexcoach.api.service;

import com.apexcoach.api.dto.response.PersonalRecordResponse;
import com.apexcoach.api.entity.Exercise;
import com.apexcoach.api.entity.User;
import com.apexcoach.api.entity.WorkoutSet;
import com.apexcoach.api.entity.enums.SetType;
import com.apexcoach.api.exception.ResourceNotFoundException;
import com.apexcoach.api.repository.ExerciseRepository;
import com.apexcoach.api.repository.WorkoutSetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PersonalRecordService {

    private final WorkoutSetRepository workoutSetRepository;
    private final ExerciseRepository exerciseRepository;
    private final AuthenticatedUserService authenticatedUserService;

    public PersonalRecordResponse getForExercise(UUID exerciseId) {
        User user = authenticatedUserService.getCurrentUser();
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise", "id", exerciseId));

        List<WorkoutSet> sets = workoutSetRepository
                .findByExerciseLogExerciseIdAndExerciseLogSessionUser(exerciseId, user)
                .stream()
                .filter(s -> s.getSetType() == SetType.WORKING
                        && s.isCompleted()
                        && s.getWeightKg().compareTo(BigDecimal.ZERO) > 0
                        && s.getReps() > 0)
                .toList();

        if (sets.isEmpty()) {
            return new PersonalRecordResponse(
                    exercise.getId(), exercise.getName(), null, null, null);
        }

        WorkoutSet best = sets.stream()
                .max(Comparator.comparing(s -> epley(s.getWeightKg(), s.getReps())))
                .orElseThrow();

        return buildResponse(exercise.getId(), exercise.getName(), best);
    }

    public List<PersonalRecordResponse> getAllForUser() {
        User user = authenticatedUserService.getCurrentUser();

        List<WorkoutSet> allSets = workoutSetRepository.findByExerciseLogSessionUser(user)
                .stream()
                .filter(s -> s.getSetType() == SetType.WORKING
                        && s.isCompleted()
                        && s.getWeightKg().compareTo(BigDecimal.ZERO) > 0
                        && s.getReps() > 0)
                .toList();

        Map<UUID, List<WorkoutSet>> byExercise = allSets.stream()
                .collect(Collectors.groupingBy(s -> s.getExerciseLog().getExercise().getId()));

        return byExercise.entrySet().stream()
                .map(entry -> {
                    WorkoutSet best = entry.getValue().stream()
                            .max(Comparator.comparing(s -> epley(s.getWeightKg(), s.getReps())))
                            .orElseThrow();
                    String name = best.getExerciseLog().getExercise().getName();
                    return buildResponse(entry.getKey(), name, best);
                })
                .toList();
    }

    // Epley formula: weight * (1 + reps / 30)
    private BigDecimal epley(BigDecimal weight, int reps) {
        return weight.multiply(BigDecimal.ONE.add(
                BigDecimal.valueOf(reps).divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP)));
    }

    private PersonalRecordResponse buildResponse(UUID exerciseId, String exerciseName, WorkoutSet best) {
        BigDecimal estimated1rm = epley(best.getWeightKg(), best.getReps())
                .setScale(2, RoundingMode.HALF_UP);
        return new PersonalRecordResponse(exerciseId, exerciseName, best.getWeightKg(), best.getReps(), estimated1rm);
    }
}
