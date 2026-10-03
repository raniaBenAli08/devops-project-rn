package com.daoninhthai.hr.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.assistant")
public record AssistantConfig(String apiKey, String endpoint, String model, boolean enabled, boolean demoMode) {}
