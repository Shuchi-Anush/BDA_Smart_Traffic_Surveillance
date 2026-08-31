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
- /api/v1/storage/buckets
- /api/v1/storage/objects
- /api/v1/storage/object
- /api/v1/storage/retrieval

## Object storage architecture

The live Docker MinIO runtime currently contains these buckets:

- traffic-data
- cctv
- vehicle-images
- traffic-sensors
- gps-logs
- incident-reports

Representative objects in the active project runtime include:

- cctv/junction-01/DLR_UT_120230_120300.mp4
- vehicle-images/representative/vehicle-01.jpg
- traffic-sensors/sensor-readings/smart_traffic_management_dataset.csv
- gps-logs/kolkata/ds 1 F 20220108-114848.txt
- incident-reports/speed-violations/speed-violations-demo.json

## Assignment task coverage

### TASK 1 — Existing storage analysis

The pipeline uses raw CSV, GPS trajectory, and video sources. Object storage is required to keep unstructured and semi-structured data alongside processed analytics and reports.

### TASK 2 — MinIO implementation

The active runtime uses Docker Compose MinIO for the project. Buckets are created on demand and verified through the backend and the MinIO API.

### TASK 3 — Bucket architecture

The application distinguishes between the preserved traffic-data bucket and the assignment buckets for CCTV, vehicle images, traffic sensor readings, GPS logs, and incident reports.

### TASK 4 — Object metadata

Representative object metadata is stored in MinIO using S3 metadata keys such as:

- x-amz-meta-camera-id
- x-amz-meta-junction-name
- x-amz-meta-vehicle-number
- x-amz-meta-timestamp
- x-amz-meta-vehicle-type
- x-amz-meta-speed
- x-amz-meta-traffic-density

### TASK 5 — Data retrieval

The backend retrieval API can fetch objects from the required buckets using the existing endpoint:

- /api/v1/storage/retrieval?bucket=...&key=...

## Demo sequence

1. Start the Docker stack.
2. Confirm all six MinIO buckets are present.
3. Validate backend health and readiness.
4. Check the storage bucket list and object inventory.
5. Retrieve the CCTV MP4 object from cctv.
6. Retrieve the vehicle image from vehicle-images.
7. Retrieve the speed violation JSON from incident-reports.
8. Inspect the MinIO metadata for object-level context.
9. Open the dashboard and confirm frontend system views remain operational.

## Important notes

- Native D:\MinIO is preserved and must not be started during this project validation.
- The Docker MinIO instance is the active object store for the application.
- Real operations are derived from the data files in the local raw dataset directory. No fake values are intentionally presented.
