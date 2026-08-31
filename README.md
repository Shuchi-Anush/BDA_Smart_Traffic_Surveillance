# Smart Traffic Surveillance

This project delivers a smart traffic monitoring dashboard with ingestion, ETL, MinIO-backed storage, FastAPI analytics, and a Next.js operations interface.

## Runtime architecture

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000](http://localhost:8000)
- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- MinIO API: [http://localhost:9000](http://localhost:9000)
- MinIO Console: [http://localhost:9001](http://localhost:9001)

The application uses the Docker stack as its live runtime. The preserved native D:\MinIO installation is intentionally separate and not used by the project runtime.

## Docker startup

```bash
docker compose up -d --build
docker compose ps
```

## Docker shutdown

```bash
docker compose down
```

## Data sources

The pipeline expects these datasets under data/raw:

1. smart_traffic_management_dataset.csv
2. iot_edge_computing_public_management.csv
3. Kolkata_Data_PMC_paper_TrafficCountEstimationUsingCrowdSourcedTrajectory-v0.1.zip
4. DLR_UT_120230_120300.mp4

## MinIO runtime configuration

The active project runtime uses the Docker Compose MinIO configuration defined in the local environment. These values are intentionally kept out of the repository and must remain local-only.

## API overview

- /health
- /ready
- /api/v1/datasets
- /api/v1/data-sources
- /api/v1/analytics/summary
- /api/v1/analytics/anomalies
- /api/v1/vehicles
- /api/v1/incidents
- /api/v1/signals
- /api/v1/map
- /api/v1/video
- /api/v1/reports
- /api/v1/storage/objects
- /api/v1/storage/object
- /api/v1/storage/retrieval

## Demo sequence

1. Start Docker stack.
2. Confirm MinIO bucket traffic-data is present.
3. Validate backend health and readiness.
4. Confirm real datasets uploaded to MinIO.
5. Open the dashboard.
6. Check traffic, vehicle, incident, anomaly, signal, map, video, and report views.
7. Retrieve an object from MinIO through the API.
8. Review generated report artifacts.

## Important notes

- Native D:\MinIO is preserved and must not be started during this project validation.
- The Docker MinIO instance is the active object store for the application.
- Real operations are derived from the data files in the local raw dataset directory. No fake values are intentionally presented.
