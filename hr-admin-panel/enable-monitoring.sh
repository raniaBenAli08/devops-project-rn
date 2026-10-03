#!/usr/bin/env bash
# Phase 5 : ajoute Actuator + métriques Prometheus au backend (idempotent).
set -euo pipefail
cd "$(dirname "$0")"

# 1) pom.xml : dépendances Actuator et Micrometer Prometheus
if grep -q "spring-boot-starter-actuator" pom.xml; then
  echo "pom.xml : déjà fait"
else
  sed -i "/<!-- Lombok -->/i\\
        <!-- Monitoring (Actuator + Prometheus) -->\\
        <dependency>\\
            <groupId>org.springframework.boot</groupId>\\
            <artifactId>spring-boot-starter-actuator</artifactId>\\
        </dependency>\\
        <dependency>\\
            <groupId>io.micrometer</groupId>\\
            <artifactId>micrometer-registry-prometheus</artifactId>\\
        </dependency>\\
" pom.xml
  echo "pom.xml : dépendances ajoutées"
fi

# 2) SecurityConfig : autoriser /actuator/health et /actuator/prometheus sans authentification
SEC=src/main/java/com/daoninhthai/hr/config/SecurityConfig.java
if grep -q "actuator/prometheus" "$SEC"; then
  echo "SecurityConfig : déjà fait"
else
  sed -i "/requestMatchers(\"\\/api\\/auth\\/\\*\\*\").permitAll()/i\\
                        .requestMatchers(\"/actuator/health/**\", \"/actuator/prometheus\").permitAll()" "$SEC"
  echo "SecurityConfig : règle ajoutée"
fi

# 3) application.yml : exposer health + prometheus
YML=src/main/resources/application.yml
if grep -q "^management:" "$YML"; then
  echo "application.yml : déjà fait"
else
  cat >> "$YML" <<"YAML"

management:
  endpoints:
    web:
      exposure:
        include: health,prometheus
  endpoint:
    health:
      probes:
        enabled: true
  metrics:
    tags:
      application: hr-admin-panel
YAML
  echo "application.yml : bloc management ajouté"
fi
