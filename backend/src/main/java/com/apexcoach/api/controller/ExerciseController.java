package com.apexcoach.api.controller;

import com.apexcoach.api.dto.request.CreateExerciseRequest;
import com.apexcoach.api.dto.response.ApiResponse;
import com.apexcoach.api.dto.response.ExerciseResponse;
import com.apexcoach.api.entity.enums.EquipmentType;
import com.apexcoach.api.entity.enums.MuscleGroup;
import com.apexcoach.api.service.ExerciseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/exercises")
@RequiredArgsConstructor
public class ExerciseController {

    private final ExerciseService exerciseService;

    // GET /api/v1/exercises?name=bench&muscleGroup=CHEST&equipment=BARBELL
    @GetMapping
    public ApiResponse<List<ExerciseResponse>> getAll(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) MuscleGroup muscleGroup,
            @RequestParam(required = false) EquipmentType equipment
    ) {
        return ApiResponse.ok(exerciseService.getAll(name, muscleGroup, equipment));
    }

    // GET /api/v1/exercises/{id}
    @GetMapping("/{id}")
    public ApiResponse<ExerciseResponse> getById(@PathVariable UUID id) {
        return ApiResponse.ok(exerciseService.getById(id));
    }

    // POST /api/v1/exercises
    @PostMapping
    public ResponseEntity<ApiResponse<ExerciseResponse>> create(
            @Valid @RequestBody CreateExerciseRequest request
    ) {
        ExerciseResponse created = exerciseService.createCustom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created, "Exercise created"));
    }
}
