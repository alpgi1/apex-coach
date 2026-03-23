package com.apexcoach.api.controller;

import com.apexcoach.api.dto.request.LogBodyWeightRequest;
import com.apexcoach.api.dto.response.ApiResponse;
import com.apexcoach.api.dto.response.BodyWeightLogResponse;
import com.apexcoach.api.service.BodyWeightService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/body-weight")
@RequiredArgsConstructor
public class BodyWeightController {

    private final BodyWeightService bodyWeightService;

    @PostMapping
    public ApiResponse<BodyWeightLogResponse> upsert(@Valid @RequestBody LogBodyWeightRequest request) {
        return ApiResponse.ok(bodyWeightService.upsert(request), "Weight logged");
    }

    @GetMapping
    public ApiResponse<List<BodyWeightLogResponse>> getHistory() {
        return ApiResponse.ok(bodyWeightService.getHistory());
    }
}
