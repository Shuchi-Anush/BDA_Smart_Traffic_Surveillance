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
