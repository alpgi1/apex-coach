package com.apexcoach.api.repository;

import com.apexcoach.api.entity.BodyWeightLog;
import com.apexcoach.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BodyWeightLogRepository extends JpaRepository<BodyWeightLog, UUID> {

    Optional<BodyWeightLog> findByUserAndDate(User user, LocalDate date);

    List<BodyWeightLog> findByUserOrderByDateDesc(User user);
}
