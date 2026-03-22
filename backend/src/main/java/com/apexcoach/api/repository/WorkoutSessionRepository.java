package com.apexcoach.api.repository;

import com.apexcoach.api.entity.User;
import com.apexcoach.api.entity.WorkoutSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, UUID> {

    Page<WorkoutSession> findAllByOrderByStartTimeDesc(Pageable pageable);

    Page<WorkoutSession> findByUserOrderByStartTimeDesc(User user, Pageable pageable);

    List<WorkoutSession> findTop20ByUserAndStartTimeAfterOrderByStartTimeDesc(User user, Instant since);
}
