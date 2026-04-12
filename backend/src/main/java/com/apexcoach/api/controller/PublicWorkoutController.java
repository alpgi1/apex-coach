package com.apexcoach.api.controller;

import com.apexcoach.api.dto.response.PublicWorkoutResponse;
import com.apexcoach.api.entity.User;
import com.apexcoach.api.entity.WorkoutSession;
import com.apexcoach.api.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/public/v1")
@RequiredArgsConstructor
public class PublicWorkoutController {

    private final WorkoutSessionRepository workoutSessionRepository;

    @GetMapping("/workouts")
    public List<PublicWorkoutResponse> getWorkouts(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "20") int limit
    ) {
        int cappedLimit = Math.min(limit, 100);
        PageRequest page = PageRequest.of(0, cappedLimit);

        return workoutSessionRepository.findByUserOrderByStartTimeDesc(user, page)
                .getContent()
                .stream()
                .map(this::toPublicResponse)
                .toList();
    }

    private PublicWorkoutResponse toPublicResponse(WorkoutSession session) {
        long durationMinutes = 0;
        if (session.getStartTime() != null && session.getEndTime() != null) {
            long seconds = session.getEndTime().getEpochSecond() - session.getStartTime().getEpochSecond();
            durationMinutes = TimeUnit.SECONDS.toMinutes(seconds);
        }
        return new PublicWorkoutResponse(
                session.getId(),
                session.getStartTime().atZone(ZoneOffset.UTC).toLocalDate(),
                durationMinutes,
                session.getVolumeKg()
        );
    }
}
