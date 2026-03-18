package com.apexcoach.api.repository;

import com.apexcoach.api.entity.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ExerciseRepository extends JpaRepository<Exercise, UUID> {

    // All default exercises
    List<Exercise> findByIsCustomFalseOrderByNameAsc();

    // All visible to user (default + own custom)
    @Query("SELECT e FROM Exercise e WHERE e.isCustom = false OR e.createdBy.id = :userId ORDER BY e.name ASC")
    List<Exercise> findAllVisibleToUser(@Param("userId") UUID userId);

    // Search by name (case-insensitive)
    List<Exercise> findByNameContainingIgnoreCaseAndIsCustomFalseOrderByNameAsc(String name);

    // Filter by muscle group — native query to handle PostgreSQL custom enum cast
    @Query(value = "SELECT * FROM exercises WHERE primary_muscle_group = CAST(:muscleGroup AS muscle_group) AND is_custom = false ORDER BY name ASC",
           nativeQuery = true)
    List<Exercise> findByMuscleGroup(@Param("muscleGroup") String muscleGroup);

    // Filter by equipment — native query to handle PostgreSQL custom enum cast
    @Query(value = "SELECT * FROM exercises WHERE equipment = CAST(:equipment AS equipment_type) AND is_custom = false ORDER BY name ASC",
           nativeQuery = true)
    List<Exercise> findByEquipmentType(@Param("equipment") String equipment);
}
