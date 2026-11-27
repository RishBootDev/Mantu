# Deployment Architecture

```mermaid
flowchart TB
    subgraph LocalDev["Local Development Host (Windows / Linux)"]
        subgraph Frontends["Vite Dev Servers"]
            FE1["Mantu Dashboard<br/>localhost:3000<br/>Proxies /v1 & /internal -> :8080"]
            FE2["Deskwell Frontend<br/>localhost:5173<br/>Proxies /api -> :8000"]
        end

        subgraph SampleBE["Sample Merchant Backend"]
            SBE["Deskwell FastAPI<br/>localhost:8000<br/>SQLite / SQLAlchemy"]
        end

        subgraph SpringPlatform["Spring Boot Platform (Java 21)"]
            EUR["eureka-discovery-service<br/>Port 8761"]
            CFG["config-service<br/>Port 8888"]
            GW["api-gateway<br/>Port 8080"]
            MS["merchant-service<br/>Dynamic/Config Port"]
            PS["payment-service<br/>Dynamic/Config Port"]
            VS["vault-service<br/>Dynamic/Config Port"]
            OS["operations-service<br/>Dynamic/Config Port"]
        end

        subgraph PythonML["Python ML Service"]
            ML["ml-services (Uvicorn)<br/>Port 8100<br/>+ AnomalyWorker"]
        end

        subgraph Backing["Backing Services & Storage"]
            MYSQL[("MySQL Server")]
            REDIS[("Redis Server")]
            KAFKA["Apache Kafka Broker"]
            ZIP["Zipkin Collector<br/>Port 9411"]
            DISK[("Local Disk<br/>./data/kyc-documents")]
        end
    end

    GIT["GitHub Config Repo<br/>distributed-mantu-config"]

    CFG -- "HTTPS Git Pull" --> GIT
    FE1 --> GW
    FE2 --> SBE
    SBE --> GW
    GW --> MS & PS & VS & OS
    OS --> SBE
    PS --> ML
    GW & MS & PS & OS & ML --> EUR
    GW & MS & PS & OS --> CFG
    MS & PS & OS & VS --> MYSQL
    GW & MS & PS & OS --> REDIS
    PS & OS & ML --> KAFKA
    MS --> DISK
    CFG --> ZIP
```

> **Note on Containerization:** No `Dockerfile` or `docker-compose.yml` files exist in the repository. `config-service` and `api-gateway` include `jib-maven-plugin:3.5.2` in `pom.xml` for OCI image generation during `mvn package`.
