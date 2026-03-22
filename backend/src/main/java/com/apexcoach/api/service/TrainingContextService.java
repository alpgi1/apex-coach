package com.apexcoach.api.service;

import com.apexcoach.api.entity.*;
import com.apexcoach.api.entity.enums.SetType;
import com.apexcoach.api.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TrainingContextService {

    private final WorkoutSessionRepository workoutSessionRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd")
            .withZone(ZoneOffset.UTC);

    /**
     * Detailed context for insights analysis (up to dayRange days, max 20 sessions).
     */
    public TrainingContext buildContextSummary(User user, int dayRange) {
        Instant since = Instant.now().minus(Duration.ofDays(dayRange));
        List<WorkoutSession> sessions = workoutSessionRepository
                .findTop20ByUserAndStartTimeAfterOrderByStartTimeDesc(user, since);

        if (sessions.isEmpty()) {
            return new TrainingContext("No workout data available for the requested period.", 0);
        }

        return new TrainingContext(formatSessions(sessions, dayRange), sessions.size());
    }

    /**
     * Lighter context for chat (last 7 days, max 20 sessions).
     */
    public TrainingContext buildChatContext(User user) {
        Instant since = Instant.now().minus(Duration.ofDays(7));
        List<WorkoutSession> sessions = workoutSessionRepository
                .findTop20ByUserAndStartTimeAfterOrderByStartTimeDesc(user, since);

        if (sessions.isEmpty()) {
            return new TrainingContext("No recent workouts in the last 7 days.", 0);
        }

        return new TrainingContext(formatSessions(sessions, 7), sessions.size());
    }

    private String formatSessions(List<WorkoutSession> sessions, int dayRange) {
        StringBuilder sb = new StringBuilder();

        // Summary header
        BigDecimal totalVolume = BigDecimal.ZERO;
        Map<String, Integer> muscleGroupCounts = new HashMap<>();

        for (WorkoutSession session : sessions) {
            totalVolume = totalVolume.add(session.getVolumeKg());
            for (ExerciseLog log : session.getLogs()) {
                String mg = log.getExercise().getPrimaryMuscleGroup().name();
                muscleGroupCounts.merge(mg, 1, Integer::sum);
            }
        }

        double weeks = Math.max(dayRange / 7.0, 1.0);
        double frequency = sessions.size() / weeks;

        sb.append("TRAINING SUMMARY (last ").append(dayRange).append(" days):\n");
        sb.append("- Total workouts: ").append(sessions.size());
        sb.append(" | Frequency: ").append(String.format("%.1f", frequency)).append("x/week\n");
        sb.append("- Total volume: ").append(totalVolume.setScale(0, RoundingMode.HALF_UP)).append(" kg\n");

        if (!muscleGroupCounts.isEmpty()) {
            sb.append("- Muscle groups: ");
            muscleGroupCounts.entrySet().stream()
                    .sorted((a, b) -> b.getValue() - a.getValue())
                    .forEach(e -> sb.append(e.getKey()).append("(").append(e.getValue()).append(") "));
            sb.append("\n");
        }

        sb.append("\nRECENT SESSIONS:\n");

        for (WorkoutSession session : sessions) {
            String date = DATE_FMT.format(session.getStartTime());
            String duration = formatDuration(session.getStartTime(), session.getEndTime());

            sb.append("[").append(date).append("] \"").append(session.getName()).append("\"");
            sb.append(" | ").append(duration);
            sb.append(" | Vol: ").append(session.getVolumeKg().setScale(0, RoundingMode.HALF_UP)).append("kg");

            if (session.getAverageRpe() != null) {
                sb.append(" | Avg RPE: ").append(session.getAverageRpe().setScale(1, RoundingMode.HALF_UP));
            }
            sb.append("\n");

            for (ExerciseLog log : session.getLogs()) {
                sb.append("  - ").append(log.getExercise().getName()).append(": ");
                List<WorkoutSet> workingSets = log.getSets().stream()
                        .filter(s -> s.getSetType() == SetType.WORKING && s.isCompleted())
                        .toList();

                if (workingSets.isEmpty()) {
                    sb.append("no working sets");
                } else {
                    for (int i = 0; i < workingSets.size(); i++) {
                        WorkoutSet set = workingSets.get(i);
                        if (i > 0) sb.append(", ");
                        sb.append(set.getWeightKg().setScale(1, RoundingMode.HALF_UP))
                                .append("kg x").append(set.getReps());
                        if (set.getRpe() != null) {
                            sb.append(" @RPE").append(set.getRpe().setScale(1, RoundingMode.HALF_UP));
                        }
                    }
                }
                sb.append("\n");
            }
        }

        return sb.toString();
    }

    private String formatDuration(Instant start, Instant end) {
        if (end == null) return "?min";
        long minutes = Duration.between(start, end).toMinutes();
        return minutes + "min";
    }

    public record TrainingContext(String text, int workoutsAnalyzed) {}
}
