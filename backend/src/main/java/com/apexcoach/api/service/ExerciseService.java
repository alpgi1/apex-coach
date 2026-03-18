package com.apexcoach.api.service;

import com.apexcoach.api.dto.request.CreateExerciseRequest;
import com.apexcoach.api.dto.response.ExerciseResponse;
import com.apexcoach.api.entity.Exercise;
import com.apexcoach.api.entity.enums.EquipmentType;
import com.apexcoach.api.entity.enums.MuscleGroup;
import com.apexcoach.api.exception.ResourceNotFoundException;
import com.apexcoach.api.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;

    public List<ExerciseResponse> getAll(String name, MuscleGroup muscleGroup, EquipmentType equipment) {
        List<Exercise> exercises;

        if (name != null && !name.isBlank()) {
            exercises = exerciseRepository.findByNameContainingIgnoreCaseAndIsCustomFalseOrderByNameAsc(name);
        } else if (muscleGroup != null) {
            exercises = exerciseRepository.findByMuscleGroup(muscleGroup.name());
        } else if (equipment != null) {
            exercises = exerciseRepository.findByEquipmentType(equipment.name());
        } else {
            exercises = exerciseRepository.findByIsCustomFalseOrderByNameAsc();
        }

        return exercises.stream().map(ExerciseResponse::from).toList();
    }

    public ExerciseResponse getById(UUID id) {
        return exerciseRepository.findById(id)
                .map(ExerciseResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise", "id", id));
    }

    @Transactional
    public ExerciseResponse createCustom(CreateExerciseRequest req) {
        Exercise exercise = Exercise.builder()
                .name(req.name())
                .primaryMuscleGroup(req.primaryMuscleGroup())
                .primaryMuscles(req.primaryMuscles() != null ? req.primaryMuscles() : List.of())
                .secondaryMuscles(req.secondaryMuscles() != null ? req.secondaryMuscles() : List.of())
                .equipment(req.equipment())
                .category(req.category())
                .idealRepsMin(req.idealRepsMin())
                .idealRepsMax(req.idealRepsMax())
                .isBilateral(req.isBilateral() != null && req.isBilateral())
                .instructions(req.instructions())
                .videoUrl(req.videoUrl())
                .isCustom(true)
                .build();

        return ExerciseResponse.from(exerciseRepository.save(exercise));
    }
}
