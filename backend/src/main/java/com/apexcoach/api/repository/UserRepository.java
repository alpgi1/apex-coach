package com.apexcoach.api.repository;

import com.apexcoach.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findBySupabaseId(String supabaseId);
}
