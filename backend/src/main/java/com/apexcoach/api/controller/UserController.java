package com.apexcoach.api.controller;

import com.apexcoach.api.service.UserDeletionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserDeletionService userDeletionService;

    /**
     * DELETE /api/v1/user/me
     * Permanently deletes the authenticated user's account and all associated data.
     * Required by Apple App Store guidelines for apps with user accounts.
     */
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount() {
        userDeletionService.deleteCurrentUser();
        return ResponseEntity.noContent().build();
    }
}
