package com.apexcoach.api.controller;

import com.apexcoach.api.dto.request.CreateWorkoutRequest;
import com.apexcoach.api.dto.response.ApiResponse;
import com.apexcoach.api.dto.response.WorkoutResponse;
import com.apexcoach.api.service.WorkoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workouts")
@RequiredArgsConstructor
public class WorkoutController {

    private final WorkoutService workoutService;

    @PostMapping
    public ResponseEntity<ApiResponse<WorkoutResponse>> create(
            @Valid @RequestBody CreateWorkoutRequest request
    ) {
        WorkoutResponse created = workoutService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(created, "Workout saved"));
    }

    @GetMapping
    public ApiResponse<Page<WorkoutResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.ok(workoutService.getAll(pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<WorkoutResponse> getById(@PathVariable UUID id) {
        return ApiResponse.ok(workoutService.getById(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        workoutService.delete(id);
        return ApiResponse.ok(null, "Workout deleted");
    }
}
