package com.apexcoach.api.service;

import com.apexcoach.api.entity.User;
import com.apexcoach.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthenticatedUserService {

    private final UserRepository userRepository;

    @Transactional
    public User getCurrentUser() {
        JwtAuthenticationToken auth = (JwtAuthenticationToken)
                SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = auth.getToken();

        String supabaseId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");

        return userRepository.findBySupabaseId(supabaseId)
                .orElseGet(() -> provisionUser(supabaseId, email));
    }

    private User provisionUser(String supabaseId, String email) {
        User user = User.builder()
                .supabaseId(supabaseId)
                .email(email)
                .name(email != null ? email.split("@")[0] : "User")
                .build();
        return userRepository.save(user);
    }
}
