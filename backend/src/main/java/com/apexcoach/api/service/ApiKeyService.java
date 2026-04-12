package com.apexcoach.api.service;

import com.apexcoach.api.entity.ApiKey;
import com.apexcoach.api.entity.User;
import com.apexcoach.api.exception.ResourceNotFoundException;
import com.apexcoach.api.repository.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private static final String KEY_PREFIX_STRING = "apex_";
    private static final int KEY_RANDOM_BYTES = 32;

    private final ApiKeyRepository apiKeyRepository;

    public record GeneratedKey(ApiKey apiKey, String plaintextKey) {}

    @Transactional
    public GeneratedKey generateKey(User user, String name) {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[KEY_RANDOM_BYTES];
        random.nextBytes(bytes);

        String randomHex = HexFormat.of().formatHex(bytes);
        String plaintextKey = KEY_PREFIX_STRING + randomHex;
        String keyHash = sha256(plaintextKey);
        String keyPrefix = plaintextKey.substring(0, 12);

        ApiKey apiKey = ApiKey.builder()
                .user(user)
                .name(name)
                .keyHash(keyHash)
                .keyPrefix(keyPrefix)
                .build();

        return new GeneratedKey(apiKeyRepository.save(apiKey), plaintextKey);
    }

    @Transactional
    public Optional<User> validateKey(String rawKey) {
        if (rawKey == null || !rawKey.startsWith(KEY_PREFIX_STRING)) {
            return Optional.empty();
        }
        String hash = sha256(rawKey);
        Optional<ApiKey> apiKey = apiKeyRepository.findByKeyHashAndIsActiveTrueWithUser(hash);
        apiKey.ifPresent(key -> key.setLastUsedAt(Instant.now()));
        return apiKey.map(ApiKey::getUser);
    }

    public List<ApiKey> listKeys(User user) {
        return apiKeyRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional
    public void revokeKey(UUID keyId, User user) {
        ApiKey key = apiKeyRepository.findById(keyId)
                .orElseThrow(() -> new ResourceNotFoundException("ApiKey", "id", keyId));
        if (!key.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("ApiKey", "id", keyId);
        }
        key.setIsActive(false);
        apiKeyRepository.save(key);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
