package com.apexcoach.api.service;

import com.apexcoach.api.dto.request.LogBodyWeightRequest;
import com.apexcoach.api.dto.response.BodyWeightLogResponse;
import com.apexcoach.api.entity.BodyWeightLog;
import com.apexcoach.api.entity.User;
import com.apexcoach.api.repository.BodyWeightLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BodyWeightService {

    private final BodyWeightLogRepository repository;
    private final AuthenticatedUserService authenticatedUserService;

    /** Upsert: if an entry already exists for this user+date, update it. */
    @Transactional
    public BodyWeightLogResponse upsert(LogBodyWeightRequest request) {
        User user = authenticatedUserService.getCurrentUser();

        BodyWeightLog log = repository.findByUserAndDate(user, request.date())
                .orElseGet(() -> BodyWeightLog.builder().user(user).date(request.date()).build());

        log.setWeightKg(request.weightKg());
        log.setNotes(request.notes());

        return BodyWeightLogResponse.from(repository.save(log));
    }

    public List<BodyWeightLogResponse> getHistory() {
        User user = authenticatedUserService.getCurrentUser();
        return repository.findByUserOrderByDateDesc(user)
                .stream()
                .map(BodyWeightLogResponse::from)
                .toList();
    }
}
