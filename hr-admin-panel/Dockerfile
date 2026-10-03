# ---- Étape 1 : compilation avec Maven + JDK 25 ----
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
# le cache Maven évite de retélécharger les dépendances à chaque build
RUN --mount=type=cache,target=/root/.m2 mvn -B -q -DskipTests package

# ---- Étape 2 : image finale légère (JRE seulement), utilisateur non-root ----
FROM eclipse-temurin:25-jre
WORKDIR /app
RUN mkdir -p /app/uploads && chown -R 1001:1001 /app
COPY --from=build --chown=1001:1001 /build/target/hr-admin-panel-0.0.1-SNAPSHOT.jar app.jar
USER 1001
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-jar", "app.jar"]
