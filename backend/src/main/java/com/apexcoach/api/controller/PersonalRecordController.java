package com.apexcoach.api.controller;

import com.apexcoach.api.dto.response.ApiResponse;
import com.apexcoach.api.dto.response.PersonalRecordResponse;
import com.apexcoach.api.service.PersonalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/records")
@RequiredArgsConstructor
public class PersonalRecordController {

    private final PersonalRecordService personalRecordService;

    @GetMapping
    public ApiResponse<List<PersonalRecordResponse>> getAll() {
        return ApiResponse.ok(personalRecordService.getAllForUser());
    }

    @GetMapping("/{exerciseId}")
    public ApiResponse<PersonalRecordResponse> getForExercise(@PathVariable UUID exerciseId) {
        return ApiResponse.ok(personalRecordService.getForExercise(exerciseId));
    }
}
