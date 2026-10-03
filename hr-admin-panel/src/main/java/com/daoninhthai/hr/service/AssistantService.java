package com.daoninhthai.hr.service;

import com.daoninhthai.hr.config.AssistantConfig;
import com.daoninhthai.hr.entity.User;
import com.daoninhthai.hr.repository.AttendanceRepository;
import com.daoninhthai.hr.repository.PayrollRepository;
import com.daoninhthai.hr.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AssistantService {
    private final AssistantConfig config;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final PayrollRepository payrollRepository;
    private final AttendanceRepository attendanceRepository;

    public boolean isDemoMode() {
        return config.demoMode();
    }

    public String demoChat(String message) {
        String normalized = message.toLowerCase(Locale.ROOT);
        if (normalized.contains("absence")) {
            return "Mode démo : Amine Benali a le plus d’absences ce mois-ci avec 3 jours (données fictives).";
        }
        if (normalized.contains("pay") || normalized.contains("salaire") || normalized.contains("septembre")) {
            return "Mode démo : votre salaire net de septembre est de 2 450 TND (données fictives).";
        }
        return "Mode démo : je peux répondre à des questions fictives sur la paie et les absences. Aucune donnée réelle n’est consultée.";
    }

    public String chat(String message, Long userId, String role) {
        if (!config.enabled() || config.apiKey() == null || config.apiKey().isBlank()) {
            throw new IllegalStateException("Assistant is not configured");
        }
        User user = userRepository.findById(userId).orElseThrow();
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "You are an HR assistant. Answer in the user's language. Never write or execute SQL. " +
                "Use tools for all HR data. Employees may only access their own data. " +
                "Admins and HR managers may access aggregate company data."));
        messages.add(Map.of("role", "user", "content", message));

        for (int attempt = 0; attempt < 4; attempt++) {
            JsonNode response;
            try {
                response = callModel(messages, tools(role));
            } catch (RestClientException exception) {
                throw new IllegalStateException("Assistant provider is unavailable", exception);
            }
            JsonNode choice = response.path("choices").path(0).path("message");
            if (choice.isMissingNode() || choice.path("content").isMissingNode() && choice.path("tool_calls").isMissingNode()) {
                throw new IllegalStateException("Assistant provider returned an invalid response");
            }
            JsonNode toolCalls = choice.path("tool_calls");
            if (!toolCalls.isArray() || toolCalls.isEmpty()) {
                return choice.path("content").asText("Je n'ai pas pu formuler une réponse.");
            }
            messages.add(objectMapper.convertValue(choice, Map.class));
            for (JsonNode call : toolCalls) {
                String name = call.path("function").path("name").asText();
                JsonNode args;
                try {
                    args = objectMapper.readTree(call.path("function").path("arguments").asText("{}"));
                } catch (JsonProcessingException exception) {
                    throw new IllegalStateException("Assistant returned invalid tool arguments", exception);
                }
                messages.add(Map.of("role", "tool", "tool_call_id", call.path("id").asText(),
                        "name", name, "content", executeTool(name, args, user, role)));
            }
        }
        throw new IllegalStateException("Assistant tool-call limit reached");
    }

    private JsonNode callModel(List<Map<String, Object>> messages, List<Map<String, Object>> tools) {
        return RestClient.create(config.endpoint()).post().contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + config.apiKey())
                .body(Map.of("model", config.model(), "messages", messages, "tools", tools, "tool_choice", "auto"))
                .retrieve().body(JsonNode.class);
    }

    private List<Map<String, Object>> tools(String role) {
        Map<String, Object> period = Map.of("type", "object", "properties",
                Map.of("month", Map.of("type", "integer"), "year", Map.of("type", "integer")),
                "required", List.of("month", "year"));
        if ("EMPLOYEE".equals(role)) {
            return List.of(function("get_my_payroll", "Get the authenticated employee's payroll for a month", period));
        }
        return List.of(
                function("get_absence_ranking", "Get employees ranked by absence count for a month", period),
                function("get_payroll_total", "Get total net payroll for a month", period));
    }

    private Map<String, Object> function(String name, String description, Map<String, Object> parameters) {
        return Map.of("type", "function", "function",
                Map.of("name", name, "description", description, "parameters", parameters));
    }

    private String executeTool(String name, JsonNode args, User user, String role) {
        int month = args.path("month").asInt(LocalDate.now().getMonthValue());
        int year = args.path("year").asInt(LocalDate.now().getYear());
        if (month < 1 || month > 12 || year < 2000 || year > 2100) {
            throw new IllegalArgumentException("Invalid month or year");
        }
        if ("get_my_payroll".equals(name) && "EMPLOYEE".equals(role) && user.getEmployee() != null) {
            Object result = payrollRepository.findByEmployeeIdAndMonthAndYear(user.getEmployee().getId(), month, year)
                    .map(p -> {
                        Map<String, Object> payroll = new LinkedHashMap<>();
                        payroll.put("month", month);
                        payroll.put("year", year);
                        payroll.put("netSalary", p.getNetSalary());
                        payroll.put("status", p.getStatus());
                        return payroll;
                    })
                    .orElse(Map.of("message", "No payroll found for this period"));
            return toJson(result);
        }
        if ("get_payroll_total".equals(name) && !"EMPLOYEE".equals(role)) {
            double total = payrollRepository.findAll().stream()
                    .filter(p -> p.getMonth() == month && p.getYear() == year)
                    .mapToDouble(p -> p.getNetSalary().doubleValue()).sum();
            return toJson(Map.of("month", month, "year", year, "totalNetSalary", total));
        }
        if ("get_absence_ranking".equals(name) && !"EMPLOYEE".equals(role)) {
            LocalDate start = LocalDate.of(year, month, 1);
            LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
            Map<String, Long> ranking = new HashMap<>();
            attendanceRepository.findByDateBetween(start, end).stream()
                    .filter(a -> "ABSENT".equals(a.getStatus().name()))
                    .forEach(a -> ranking.merge(a.getEmployee().getFullName(), 1L, Long::sum));
            return toJson(ranking);
        }
        throw new SecurityException("Tool is not allowed for this user");
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Could not serialize assistant result", exception);
        }
    }
}
