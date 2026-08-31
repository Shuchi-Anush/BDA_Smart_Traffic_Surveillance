# Smart Traffic Surveillance Demo Guide

## 1. Start the project

```powershell
cd D:\BDA_Smart_Traffic_Surveillance
docker compose up -d --build
docker compose ps
```

Expected services:

- traffic-minio
- traffic-backend
- traffic-frontend

## 2. Open the application

- Dashboard: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000](http://localhost:8000)
- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- MinIO Console: [http://localhost:9001](http://localhost:9001)
- MinIO S3 API: [http://localhost:9000](http://localhost:9000)

## 3. Demo flow

1. Architecture review
2. Four dataset audit
3. MinIO bucket inspection
4. System health
5. Traffic dashboard
6. Vehicles dashboard
7. Incidents dashboard
8. Anomalies dashboard
9. Signals dashboard
10. Map dashboard
11. Video / CV dashboard
12. Reports dashboard
13. Swagger / API inspection
14. MinIO retrieval validation
15. End-to-end pipeline walkthrough

## 4. MinIO validation

Open the MinIO Console at [http://localhost:9001](http://localhost:9001) using the Docker runtime credentials configured for the project environment.

Then inspect the bucket `traffic-data` and verify objects under:

- raw/
- derived/
- reports/

Use the API to prove actual object retrieval and metadata exposure.

## 5. Dataset review

The live system uses these four primary datasets:

1. smart_traffic_management_dataset.csv
2. iot_edge_computing_public_management.csv
3. Kolkata_Data_PMC_paper_TrafficCountEstimationUsingCrowdSourcedTrajectory-v0.1.zip
4. DLR_UT_120230_120300.mp4

The dashboard is fed from the actual runtime dataset files and their processed summaries.

## 6. API checks

Use the Swagger UI at [http://localhost:8000/docs](http://localhost:8000/docs) or call the backend directly:

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

## 7. Shutdown

```powershell
docker compose down --remove-orphans
docker ps
```

No project containers should remain running after shutdown. Native MinIO under D:\MinIO must remain untouched.

## 8. Honest implementation notes

- The video pipeline is a baseline OpenCV background-subtraction workflow, not a deep-learning detector.
- Incident generation is rule-derived from structured traffic and IoT data rather than a pure ML incident model.
- The project demonstrates a real end-to-end pipeline from file ingestion to MinIO storage, backend processing, and frontend display.
