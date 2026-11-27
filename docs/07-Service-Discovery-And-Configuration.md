# 07 — Service Discovery and Configuration

---

## 1. Service Discovery (`eureka-discovery-service`)

- **Module**: `microservices/eureka-discovery-service` (`DiscoveryServiceApplication` with `@EnableEurekaServer`).
- **Port**: `8761`.
- **Configuration (`application.yaml`)**:
  - `eureka.client.register-with-eureka: false`
  - `eureka.client.fetch-registry: false`
- **Registered Clients**:
  - All Spring Boot services (`api-gateway`, `config-service`, `merchant-service`, `payment-service`, `vault-service`, `operations-service`) include `spring-cloud-starter-netflix-eureka-client`.
  - **Polyglot ML Registration**: `ml-services` registers itself with Eureka using `py-eureka-client` (`src/app/core/eureka.py`) under `app_name = "ml-services"`, allowing `payment-service` OpenFeign clients (`FraudDetectionClient`, `SmartRoutingClient`) to resolve `ml-services` via Eureka without hardcoded ports in production/cluster mode.

![Eureka Discovery Dashboard showing Spring Boot services and ML-SERVICES](<../screenshots/Screenshot%202026-11-27%20122631.png>)
![IntelliJ Services Running All 7 Spring Boot Applications](<../screenshots/Screenshot%202026-11-27%20143508.png>)

---

## 2. Centralized Configuration (`config-service`)

- **Module**: `microservices/config-service` (`ConfigServiceApplication` with `@EnableConfigServer`).
- **Port**: `8888`.
- **Git Backend (`application.yaml`)**:
  - `spring.cloud.config.server.git.uri`: `https://github.com/rishbootdev/distributed-mantu-config`
  - `default-label`: `main`
- **Client Consumption**:
  - `api-gateway`, `merchant-service`, `payment-service`, `vault-service`, and `operations-service` all set:
    ```yaml
    spring:
      config:
        import: configserver:${CONFIG_SERVER_URL:http://localhost:8888}
    ```
- **Properties Supplied Remotely**:
  - Individual service `server.port` bindings (for the 4 domain services)
  - `spring.datasource.url`, username, and password for MySQL
  - `spring.data.redis.*` host/port
  - `spring.kafka.bootstrap-servers` and `app.kafka.topics.*` (`order`, `payment`, `refund`, `settlement`)
  - Shared `jwt.secret-key`, `vault.master-key`, and `webhoook.secret-encryption-key`

> **Configuration Anomaly Observed:** `config-service/src/main/resources/application.yaml` contains a second YAML document after `---` without a `spring.config.activate.on-profile` selector, which overrides Eureka registration (`eureka.client.enabled: false`) and clears `management.zipkin.tracing.endpoint` when loaded. In addition, the `config-service` `application.yaml` embeds a GitHub credential directly in versioned config (redacted in documentation).
