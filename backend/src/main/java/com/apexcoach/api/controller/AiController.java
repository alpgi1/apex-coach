package com.apexcoach.api.controller;

import com.apexcoach.api.dto.request.AiChatRequest;
import com.apexcoach.api.dto.request.AiInsightsRequest;
import com.apexcoach.api.dto.response.AiChatResponse;
import com.apexcoach.api.dto.response.AiInsightsResponse;
import com.apexcoach.api.dto.response.ApiResponse;
import com.apexcoach.api.service.AiCoachService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiCoachService aiCoachService;

    @PostMapping("/chat")
    public ApiResponse<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) {
        return ApiResponse.ok(aiCoachService.chat(request));
    }

    @PostMapping("/insights")
    public ApiResponse<AiInsightsResponse> insights(@Valid @RequestBody AiInsightsRequest request) {
        return ApiResponse.ok(aiCoachService.generateInsights(request));
    }
}
