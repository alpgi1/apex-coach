package com.apexcoach.api.repository;

import com.apexcoach.api.entity.User;
import com.apexcoach.api.entity.WorkoutSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkoutSetRepository extends JpaRepository<WorkoutSet, UUID> {
    List<WorkoutSet> findByExerciseLogExerciseIdAndExerciseLogSessionUser(UUID exerciseId, User user);
}
