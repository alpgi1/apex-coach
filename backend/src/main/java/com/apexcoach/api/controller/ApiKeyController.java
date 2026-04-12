package com.apexcoach.api.controller;

import com.apexcoach.api.dto.request.GenerateApiKeyRequest;
import com.apexcoach.api.dto.response.ApiKeyResponse;
import com.apexcoach.api.dto.response.ApiResponse;
import com.apexcoach.api.dto.response.GenerateApiKeyResponse;
import com.apexcoach.api.entity.ApiKey;
import com.apexcoach.api.entity.User;
import com.apexcoach.api.service.ApiKeyService;
import com.apexcoach.api.service.AuthenticatedUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/api-keys")
@RequiredArgsConstructor
public class ApiKeyController {

    private final ApiKeyService apiKeyService;
    private final AuthenticatedUserService authenticatedUserService;

    @PostMapping
    public ResponseEntity<ApiResponse<GenerateApiKeyResponse>> generate(
            @Valid @RequestBody GenerateApiKeyRequest request
    ) {
        User user = authenticatedUserService.getCurrentUser();
        ApiKeyService.GeneratedKey generated = apiKeyService.generateKey(user, request.name());
        ApiKey key = generated.apiKey();

        GenerateApiKeyResponse response = new GenerateApiKeyResponse(
                key.getId(),
                key.getName(),
                generated.plaintextKey(),
                key.getKeyPrefix(),
                key.getCreatedAt()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "API key generated. Store it securely — it will not be shown again."));
    }

    @GetMapping
    public ApiResponse<List<ApiKeyResponse>> list() {
        User user = authenticatedUserService.getCurrentUser();
        List<ApiKeyResponse> keys = apiKeyService.listKeys(user).stream()
                .map(k -> new ApiKeyResponse(
                        k.getId(),
                        k.getName(),
                        k.getKeyPrefix(),
                        k.getIsActive(),
                        k.getLastUsedAt(),
                        k.getCreatedAt()
                ))
                .toList();
        return ApiResponse.ok(keys);
    }

    @DeleteMapping("/{keyId}")
    public ApiResponse<Void> revoke(@PathVariable UUID keyId) {
        User user = authenticatedUserService.getCurrentUser();
        apiKeyService.revokeKey(keyId, user);
        return ApiResponse.ok(null, "API key revoked");
    }
}
