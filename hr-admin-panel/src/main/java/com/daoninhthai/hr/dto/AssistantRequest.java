package com.daoninhthai.hr.dto;

import jakarta.validation.constraints.NotBlank;

public record AssistantRequest(@NotBlank String message) {}
