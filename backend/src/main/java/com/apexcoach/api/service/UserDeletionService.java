package com.apexcoach.api.service;

import com.apexcoach.api.config.SupabaseConfig;
import com.apexcoach.api.entity.User;
import com.apexcoach.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserDeletionService {

    private final UserRepository userRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final RestTemplate restTemplate;
    private final SupabaseConfig supabaseConfig;

    /**
     * Deletes the currently authenticated user and all their data.
     * The DB-level ON DELETE CASCADE handles workouts, templates, weight logs,
     * personal records, and all nested records automatically.
     * After DB deletion, the Supabase auth account is removed so the user
     * cannot sign back in with the same credentials.
     */
    @Transactional
    public void deleteCurrentUser() {
        User user = authenticatedUserService.getCurrentUser();
        String supabaseId = user.getSupabaseId();

        // Delete from our database — cascades to all related tables
        userRepository.delete(user);
        userRepository.flush();

        // Delete from Supabase auth (best-effort, non-blocking if it fails)
        try {
            deleteSupabaseAuthUser(supabaseId);
        } catch (Exception e) {
            // Auth account deletion failure is non-fatal for the user experience;
            // the local data is already gone and they cannot sync new data.
            log.warn("Failed to delete Supabase auth user {}: {}", supabaseId, e.getMessage());
        }
    }

    private void deleteSupabaseAuthUser(String supabaseId) {
        String url = supabaseConfig.getUrl() + "/auth/v1/admin/users/" + supabaseId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", supabaseConfig.getServiceRoleKey());
        headers.set("Authorization", "Bearer " + supabaseConfig.getServiceRoleKey());

        restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), Void.class);
        log.info("Deleted Supabase auth user {}", supabaseId);
    }
}
