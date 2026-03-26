package com.apexcoach.api.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "supabase")
@Getter
@Setter
public class SupabaseConfig {

    private String url;
    private String serviceRoleKey;
}
