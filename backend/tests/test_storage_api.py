from fastapi.testclient import TestClient

from backend.main import create_app


def test_storage_object_endpoints_return_api_contract():
    client = TestClient(create_app())

    objects_response = client.get("/api/v1/storage/objects")
    assert objects_response.status_code == 200
    objects_payload = objects_response.json()
    assert "objects" in objects_payload

    missing_response = client.get("/api/v1/storage/object", params={"key": "missing-object-for-test"})
    assert missing_response.status_code == 200
    missing_payload = missing_response.json()
    assert missing_payload["status"] in {"missing", "error"}


def test_required_project_buckets_are_exposed_and_listed():
    client = TestClient(create_app())

    buckets_response = client.get("/api/v1/storage/buckets")
    assert buckets_response.status_code == 200
    buckets_payload = buckets_response.json()
    assert "buckets" in buckets_payload
    required = {"cctv", "vehicle-images", "traffic-sensors", "gps-logs", "incident-reports"}
    assert required.issubset(set(buckets_payload["buckets"]))

    traffic_response = client.get("/api/v1/storage/objects", params={"bucket": "traffic-data", "prefix": "raw/"})
    assert traffic_response.status_code == 200
    traffic_payload = traffic_response.json()
    assert traffic_payload["bucket"] == "traffic-data"
    assert traffic_payload["count"] >= 1


def test_bucket_specific_retrieval_includes_metadata_and_missing_bucket_handling():
    client = TestClient(create_app())

    retrieval_response = client.get(
        "/api/v1/storage/retrieval",
        params={"bucket": "traffic-data", "key": "raw/smart_traffic_management_dataset.csv"},
    )
    assert retrieval_response.status_code == 200
    retrieval_payload = retrieval_response.json()
    assert retrieval_payload["status"] == "available"
    assert retrieval_payload["bucket"] == "traffic-data"
    assert "preview" in retrieval_payload

    missing_bucket_response = client.get("/api/v1/storage/retrieval", params={"bucket": "missing-bucket", "key": "missing-key"})
    assert missing_bucket_response.status_code == 200
    missing_bucket_payload = missing_bucket_response.json()
    assert missing_bucket_payload["status"] == "missing"
    assert missing_bucket_payload["bucket"] == "missing-bucket"

    bucket_listing = client.get("/api/v1/storage/buckets")
    assert "missing-bucket" not in bucket_listing.json()["buckets"]
