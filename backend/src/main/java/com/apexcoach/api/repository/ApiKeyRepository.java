package com.apexcoach.api.repository;

import com.apexcoach.api.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID> {

    @Query("SELECT k FROM ApiKey k JOIN FETCH k.user WHERE k.keyHash = :keyHash AND k.isActive = true")
    Optional<ApiKey> findByKeyHashAndIsActiveTrueWithUser(@Param("keyHash") String keyHash);

    List<ApiKey> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
