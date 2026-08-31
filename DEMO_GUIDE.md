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

Then inspect the live MinIO buckets and verify the assigned object-store layout:

- traffic-data
- cctv
- vehicle-images
- traffic-sensors
- gps-logs
- incident-reports

Representative live examples include:

- cctv/junction-01/DLR_UT_120230_120300.mp4
- vehicle-images/representative/vehicle-01.jpg
- traffic-sensors/sensor-readings/smart_traffic_management_dataset.csv
- gps-logs/kolkata/ds 1 F 20220108-114848.txt
- incident-reports/speed-violations/speed-violations-demo.json

Use the existing API to prove retrieval and metadata exposure.

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
- /api/v1/storage/buckets
- /api/v1/storage/objects
- /api/v1/storage/object
- /api/v1/storage/retrieval

Example demo retrievals:

- /api/v1/storage/retrieval?bucket=vehicle-images&key=representative/vehicle-01.jpg
- /api/v1/storage/retrieval?bucket=cctv&key=junction-01/DLR_UT_120230_120300.mp4
- /api/v1/storage/retrieval?bucket=incident-reports&key=speed-violations/speed-violations-demo.json

## 7. Assignment requirement mapping

- TASK 1: Existing storage analysis
- TASK 2: MinIO installation, bucket creation, dataset upload, verification
- TASK 3: Bucket architecture for CCTV, vehicle images, traffic sensors, GPS logs, incident reports
- TASK 4: MinIO metadata exposure for camera ID, junction name, vehicle number, timestamp, vehicle type, speed, traffic density
- TASK 5: Retrieval demonstrations for vehicle image, CCTV footage, and speed violation report

## 8. Shutdown

```powershell
docker compose down --remove-orphans
docker ps
```

No project containers should remain running after shutdown. Native MinIO under D:\MinIO must remain untouched.

## 8. Honest implementation notes

- The video pipeline is a baseline OpenCV background-subtraction workflow, not a deep-learning detector.
- Incident generation is rule-derived from structured traffic and IoT data rather than a pure ML incident model.
- The project demonstrates a real end-to-end pipeline from file ingestion to MinIO storage, backend processing, and frontend display.
