package com.apexcoach.api.service;

import com.apexcoach.api.dto.request.CreateTemplateRequest;
import com.apexcoach.api.dto.request.TemplateExerciseRequest;
import com.apexcoach.api.dto.request.UpdateTemplateRequest;
import com.apexcoach.api.dto.response.TemplateResponse;
import com.apexcoach.api.entity.Exercise;
import com.apexcoach.api.entity.TemplateExercise;
import com.apexcoach.api.entity.User;
import com.apexcoach.api.entity.WorkoutTemplate;
import com.apexcoach.api.exception.ResourceNotFoundException;
import com.apexcoach.api.repository.ExerciseRepository;
import com.apexcoach.api.repository.WorkoutTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TemplateService {

    private final WorkoutTemplateRepository templateRepository;
    private final ExerciseRepository exerciseRepository;
    private final AuthenticatedUserService authenticatedUserService;

    public List<TemplateResponse> getAll() {
        User user = authenticatedUserService.getCurrentUser();
        return templateRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(TemplateResponse::from).toList();
    }

    @Transactional
    public TemplateResponse create(CreateTemplateRequest request) {
        User user = authenticatedUserService.getCurrentUser();

        WorkoutTemplate template = WorkoutTemplate.builder()
                .user(user)
                .name(request.name())
                .description(request.description())
                .primaryMuscleGroups(request.primaryMuscleGroups() != null
                        ? request.primaryMuscleGroups() : List.of())
                .build();

        addExercises(template, request.exercises());
        return TemplateResponse.from(templateRepository.save(template));
    }

    @Transactional
    public TemplateResponse update(UUID id, UpdateTemplateRequest request) {
        User user = authenticatedUserService.getCurrentUser();
        WorkoutTemplate template = templateRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("WorkoutTemplate", "id", id));

        if (request.name() != null) template.setName(request.name());
        if (request.description() != null) template.setDescription(request.description());
        if (request.primaryMuscleGroups() != null) template.setPrimaryMuscleGroups(request.primaryMuscleGroups());
        if (request.exercises() != null) {
            template.getExercises().clear();
            addExercises(template, request.exercises());
        }

        return TemplateResponse.from(templateRepository.saveAndFlush(template));
    }

    @Transactional
    public void delete(UUID id) {
        User user = authenticatedUserService.getCurrentUser();
        WorkoutTemplate template = templateRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("WorkoutTemplate", "id", id));
        templateRepository.delete(template);
    }

    private void addExercises(WorkoutTemplate template, List<TemplateExerciseRequest> reqs) {
        for (TemplateExerciseRequest r : reqs) {
            Exercise exercise = exerciseRepository.findById(r.exerciseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Exercise", "id", r.exerciseId()));
            template.getExercises().add(TemplateExercise.builder()
                    .template(template)
                    .exercise(exercise)
                    .sortOrder(r.sortOrder())
                    .targetSets(r.targetSets())
                    .targetRepsMin(r.targetRepsMin())
                    .targetRepsMax(r.targetRepsMax())
                    .targetRpe(r.targetRpe())
                    .restTargetSeconds(r.restTargetSeconds())
                    .build());
        }
    }
}
