package com.apexcoach.api.repository;

import com.apexcoach.api.entity.User;
import com.apexcoach.api.entity.WorkoutTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkoutTemplateRepository extends JpaRepository<WorkoutTemplate, UUID> {
    List<WorkoutTemplate> findByUserOrderByCreatedAtDesc(User user);
}
