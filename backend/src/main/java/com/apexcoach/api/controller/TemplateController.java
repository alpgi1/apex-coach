package com.apexcoach.api.controller;

import com.apexcoach.api.dto.request.CreateTemplateRequest;
import com.apexcoach.api.dto.request.UpdateTemplateRequest;
import com.apexcoach.api.dto.response.ApiResponse;
import com.apexcoach.api.dto.response.TemplateResponse;
import com.apexcoach.api.service.TemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    @GetMapping
    public ApiResponse<List<TemplateResponse>> getAll() {
        return ApiResponse.ok(templateService.getAll());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TemplateResponse>> create(
            @Valid @RequestBody CreateTemplateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(templateService.create(request), "Template created"));
    }

    @PutMapping("/{id}")
    public ApiResponse<TemplateResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTemplateRequest request
    ) {
        return ApiResponse.ok(templateService.update(id, request), "Template updated");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        templateService.delete(id);
        return ApiResponse.ok(null, "Template deleted");
    }
}
