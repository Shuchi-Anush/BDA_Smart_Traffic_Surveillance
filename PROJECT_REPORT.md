# Smart Traffic Surveillance – Project Report

## 1. Overview

This project implements a smart traffic surveillance workflow that ingests raw traffic, GPS, and video data, stores it in MinIO object storage, processes it through a FastAPI analytics layer, and presents the operational output in a Next.js control-room interface. The design supports both long-term data retention and fast retrieval of project-specific artifacts.

## 2. Task 1 – Existing storage analysis

The project works with multiple real data types:

- structured CSV traffic sensor data
- GPS trajectory / movement logs from the Kolkata dataset
- video footage for CCTV and junction monitoring
- derived analytics and incident summaries

These data types require a storage solution that handles both tabular and unstructured content, which is why MinIO object storage is used alongside the application’s API and dashboard layer.

## 3. Task 2 – MinIO implementation

The project uses the Docker Compose runtime with a live MinIO instance for application storage. The implementation includes:

- bucket verification and creation
- bucket-specific object listing
- retrieval of stored content through the backend API
- project-specific object placement under meaningful prefixes

The active storage workflow preserves the existing `traffic-data` bucket while adding the required assignment buckets for CCTV, vehicle imagery, sensor data, GPS logs, and incident reports.

## 4. Task 3 – Bucket architecture

The active object-store layout is:

- `traffic-data` – preserved baseline project data and generated output
- `cctv` – CCTV footage, including `junction-01/DLR_UT_120230_120300.mp4`
- `vehicle-images` – vehicle identification and ANPR-style image samples
- `traffic-sensors` – CSV sensor data samples
- `gps-logs` – trajectory and movement logs from the Kolkata source
- `incident-reports` – JSON speed-violation and derived incident records

## 5. Task 4 – Object metadata

Representative MinIO objects include project-relevant metadata such as:

- Camera ID
- Junction Name
- Vehicle Number
- Timestamp
- Vehicle Type
- Speed
- Traffic Density

The metadata is written using S3/MinIO metadata keys such as:

- `x-amz-meta-camera-id`
- `x-amz-meta-junction-name`
- `x-amz-meta-vehicle-number`
- `x-amz-meta-timestamp`
- `x-amz-meta-vehicle-type`
- `x-amz-meta-speed`
- `x-amz-meta-traffic-density`

These values are derived from the available project datasets and demonstration data where real capture metadata is not available.

## 6. Task 5 – Data retrieval

The backend supports retrieval through the existing API contract:

- `/api/v1/storage/retrieval?bucket=...&key=...`

Representative retrieval demonstrations include:

- vehicle image retrieval from `vehicle-images`
- CCTV retrieval from `cctv`
- violation report retrieval from `incident-reports`

## 7. Demo sequence

1. Start the Docker Compose stack.
2. Confirm the MinIO console and bucket list.
3. Validate backend health and readiness.
4. Inspect object inventory for the six buckets.
5. Retrieve the CCTV video object.
6. Retrieve the vehicle image object.
7. Retrieve the speed-violation report JSON.
8. Review MinIO metadata for the object-level evidence.
9. Confirm the frontend and API continue to serve the project dashboard and analytics views.

## 8. Conclusion

The application demonstrates a real end-to-end surveillance workflow using MinIO as the storage layer, FastAPI as the service layer, and Next.js as the operations interface. The design satisfies the storage, metadata, and retrieval requirements for the project assignment while preserving the original project dataset and native D:\MinIO installation.
