package com.apexcoach.api.controller;

import com.apexcoach.api.dto.response.WorkoutResponse;
import com.apexcoach.api.exception.ResourceNotFoundException;
import com.apexcoach.api.service.WorkoutService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(WorkoutController.class)
@AutoConfigureMockMvc(addFilters = false)
class WorkoutControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean WorkoutService workoutService;

    // ── POST /api/v1/workouts ────────────────────────────────────────────────

    @Test
    void create_returns201_withValidRequest() throws Exception {
        WorkoutResponse stub = new WorkoutResponse(
                UUID.randomUUID(), "Push Day", Instant.now(), null,
                new BigDecimal("1000"), null, null, new BigDecimal("8.5"), List.of());
        when(workoutService.create(any())).thenReturn(stub);

        mockMvc.perform(post("/api/v1/workouts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validWorkoutJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Push Day"))
                .andExpect(jsonPath("$.data.volumeKg").value(1000));
    }

    @Test
    void create_returns400_whenNameIsBlank() throws Exception {
        mockMvc.perform(post("/api/v1/workouts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                              "name": "",
                              "startTime": "2026-03-25T10:00:00Z",
                              "logs": [
                                { "exerciseId": "00000000-0000-0000-0000-000000000001",
                                  "order": 0,
                                  "sets": [{"setNumber":1,"weightKg":100,"reps":5,"setType":"WORKING","isCompleted":true}] }
                              ]
                            }
                        """))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(workoutService);
    }

    @Test
    void create_returns400_whenLogsListIsEmpty() throws Exception {
        mockMvc.perform(post("/api/v1/workouts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name": "Push Day", "startTime": "2026-03-25T10:00:00Z", "logs": []}
                        """))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(workoutService);
    }

    // ── GET /api/v1/workouts ─────────────────────────────────────────────────

    @Test
    void getAll_returns200_withPagedResults() throws Exception {
        WorkoutResponse stub = new WorkoutResponse(
                UUID.randomUUID(), "Leg Day", Instant.now(), null,
                new BigDecimal("500"), null, null, null, List.of());
        when(workoutService.getAll(any()))
                .thenReturn(new PageImpl<>(List.of(stub), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/v1/workouts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].name").value("Leg Day"));
    }

    // ── GET /api/v1/workouts/{id} ────────────────────────────────────────────

    @Test
    void getById_returns404_whenWorkoutNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(workoutService.getById(id))
                .thenThrow(new ResourceNotFoundException("WorkoutSession", "id", id));

        mockMvc.perform(get("/api/v1/workouts/{id}", id))
                .andExpect(status().isNotFound());
    }

    // ── DELETE /api/v1/workouts/{id} ─────────────────────────────────────────

    @Test
    void delete_returns200_andDelegatesToService() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(workoutService).delete(id);

        mockMvc.perform(delete("/api/v1/workouts/{id}", id))
                .andExpect(status().isOk());

        verify(workoutService).delete(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String validWorkoutJson() {
        return """
            {
              "name": "Push Day",
              "startTime": "2026-03-25T10:00:00Z",
              "logs": [
                {
                  "exerciseId": "00000000-0000-0000-0000-000000000001",
                  "order": 0,
                  "sets": [
                    {"setNumber":1,"weightKg":100,"reps":5,"setType":"WORKING","isCompleted":true}
                  ]
                }
              ]
            }
        """;
    }
}
