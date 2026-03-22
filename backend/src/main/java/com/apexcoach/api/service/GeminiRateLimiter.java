package com.apexcoach.api.service;

import com.apexcoach.api.config.GeminiConfig;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentLinkedQueue;

@Component
public class GeminiRateLimiter {

    private final ConcurrentLinkedQueue<Instant> requestTimestamps = new ConcurrentLinkedQueue<>();
    private final int maxRequestsPerMinute;

    public GeminiRateLimiter(GeminiConfig config) {
        this.maxRequestsPerMinute = config.getMaxRequestsPerMinute();
    }

    public synchronized boolean tryAcquire() {
        Instant now = Instant.now();
        Instant windowStart = now.minusSeconds(60);

        while (!requestTimestamps.isEmpty() && requestTimestamps.peek().isBefore(windowStart)) {
            requestTimestamps.poll();
        }

        if (requestTimestamps.size() >= maxRequestsPerMinute) {
            return false;
        }

        requestTimestamps.add(now);
        return true;
    }
}
