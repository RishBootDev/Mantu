# 20 — Development, Execution and Deployment

---

## 1. Prerequisites

- **Java**: JDK `21` (Maven wrapper `.\mvnw.cmd` / `./mvnw` included in each microservice)
- **Python**: `>= 3.11` (for `ml-services` and `sample_merchant_application/backend`)
- **Node.js**: `>= 18` / `npm` (for `frontend` and `sample_merchant_application/frontend`)
- **Backing Infrastructure**:
  - **MySQL** (4 schemas for `merchant-service`, `payment-service`, `vault-service`, `operations-service`)
  - **Redis** (required by `api-gateway`, `common-library`, `payment-service`, `operations-service`)
  - **Apache Kafka** (required by `payment-service`, `operations-service`, and `ml-services` `AnomalyWorker`)
  - **Zipkin** (optional, port `9411` for distributed tracing)

> **Docker Status**: No `Dockerfile` or `docker-compose.yml` is present in the repository. `config-service` and `api-gateway` configure `jib-maven-plugin:3.5.2` for OCI image builds via `mvnw package`.

---

## 2. Recommended Local Startup Sequence

### Step 1: Start Infrastructure
Start local **MySQL**, **Redis**, and **Kafka** (plus **Zipkin** on `9411` if tracing is desired).

### Step 2: Build `common-library` (First-Time / After Changes)
```powershell
cd D:\Mantu\microservices\common-library
.\mvnw.cmd clean install -DskipTests
```

### Step 3: Start Discovery & Config Servers
1. **`eureka-discovery-service`** (Port `8761`):
   ```powershell
   cd D:\Mantu\microservices\eureka-discovery-service
   .\mvnw.cmd spring-boot:run
   ```
2. **`config-service`** (Port `8888`):
   ```powershell
   cd D:\Mantu\microservices\config-service
   .\mvnw.cmd spring-boot:run
   ```

### Step 4: Start ML Services (Port `8100`)
```powershell
cd D:\Mantu\ml-services
uvicorn app.main:app --reload --port 8100
```
*(Optional background Kafka anomaly worker: `python -m app.workers.anomaly_worker`)*

### Step 5: Start Core Spring Boot Microservices & API Gateway
Start `merchant-service`, `vault-service`, `payment-service`, and `operations-service` (waiting for Config Server & Eureka), then start `api-gateway` (Port `8080`):
```powershell
cd D:\Mantu\microservices\api-gateway
.\mvnw.cmd spring-boot:run
```

### Step 6: Start Frontends & Deskwell Sample App
1. **Mantu Dashboard** (Port `3000`):
   ```powershell
   cd D:\Mantu\frontend
   npm install
   npx vite
   ```
2. **Deskwell Backend** (Port `8000`, configure `.env` with `MANTU_KEY_ID`, `MANTU_KEY_SECRET`, `MANTU_WEBHOOK_SECRET`):
   ```powershell
   cd D:\Mantu\sample_merchant_application\backend
   .venv\Scripts\uvicorn app.main:app --reload --port 8000
   ```
3. **Deskwell Frontend** (Port `5173`):
   ```powershell
   cd D:\Mantu\sample_merchant_application\frontend
   npm install
   npx vite
   ```

---

## 3. Environment Variables (Redacted Reference)

- **`ml-services/.env.example`**: `SERVICE_PORT=8100`, `EUREKA_ENABLED=true`, `EUREKA_SERVER_URL=http://localhost:8761/eureka/`, `KAFKA_BOOTSTRAP_SERVERS=localhost:9092`, `KAFKA_TRANSACTION_TOPIC=payment.transaction.created`, `KAFKA_ANOMALY_TOPIC=ml.transaction.anomaly.detected`, `ANOMALY_ALERT_THRESHOLD=0.50`.
- **Spring Services**: `CONFIG_SERVER_URL`, `EUREKA_SERVER_URL`, `MERCHANT_SERVICE_URI`, `PAYMENT_SERVICE_URI`, `VAULT_SERVICE_URI`, `OPERATIONS_SERVICE_URI`, `jwt.secret-key`, `vault.master-key`, `webhoook.secret-encryption-key`.
- **Deskwell Backend**: `MANTU_BASE_URL=http://localhost:8080`, `MANTU_KEY_ID=<redacted>`, `MANTU_KEY_SECRET=<redacted>`, `MANTU_WEBHOOK_SECRET=<redacted>`, `DATABASE_URL`.

---

## 4. Common Troubleshooting

- **Config Server startup failure**: Ensure `eureka-discovery-service` (`8761`) and `config-service` (`8888`) are running before starting core services, and verify network access to the configured Git config repository.
- **`KAFKA_BOOTSTRAP_SERVERS` mismatch in `ml-services`**: `config.py` defaults to `localhost:19092` while `.env.example` sets `localhost:9092`; set `KAFKA_BOOTSTRAP_SERVERS` explicitly in `.env`.
- **Gateway returns `403 KYC_REQUIRED`**: The merchant's KYC status is still `PENDING_KYC` / `UNDER_REVIEW`. Approve via Ops review link or `POST /v1/merchants/kyc/approve-demo`.

---

## 5. Running Services Reference

![All 7 Spring Boot Services Running in IntelliJ](<../screenshots/Screenshot%202026-11-27%20143508.png>)
![Eureka Service Registry (Port 8761)](<../screenshots/Screenshot%202026-11-27%20122631.png>)
![ML Services Running on Port 8100](<../screenshots/Screenshot%202026-11-27%20143831.png>)
![Deskwell Backend Running on Port 8000](<../screenshots/Screenshot%202026-11-27%20143608.png>)
