import sys
import os

# Add backend app directory to sys.path to resolve imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("Starting E2E API Validation...")

    # 1. Health check
    response = client.get("/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert response.json() == {"status": "healthy"}
    print("[OK] Health Check passed")

    # 2. Create Session (Python topic)
    session_payload = {"topic": "Python"}
    response = client.post("/sessions", json=session_payload)
    assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    session_data = response.json()
    assert session_data["topic"] == "Python"
    assert session_data["is_completed"] is False
    session_id = session_data["id"]
    print("[OK] Create Session passed")

    # 3. List Sessions and confirm the new one exists
    list_response = client.get("/sessions")
    assert list_response.status_code == 200
    sessions_list = list_response.json()
    assert len(sessions_list) >= 1
    assert any(s["id"] == session_id for s in sessions_list)
    print("[OK] List Sessions passed")

    # 4. Generate Question (should trigger fallback question since API Key is placeholder)
    question_response = client.post(f"/sessions/{session_id}/questions")
    assert question_response.status_code == 201
    question_data = question_response.json()
    assert question_data["session_id"] == session_id
    assert "question_text" in question_data
    # Confirms it returned the correct Python fallback question
    assert "difference between a list and a tuple" in question_data["question_text"]
    question_id = question_data["id"]
    print("[OK] Generate Question (Fallback) passed")

    # 5. Try generating a second question (should return the same question instead of creating duplicates)
    dup_response = client.post(f"/sessions/{session_id}/questions")
    assert dup_response.status_code == 201
    dup_data = dup_response.json()
    assert dup_data["id"] == question_id
    print("[OK] Duplicate Question Check passed")

    # 6. Get Session details and confirm question exists
    detail_response = client.get(f"/sessions/{session_id}")
    assert detail_response.status_code == 200
    detail_data = detail_response.json()
    assert detail_data["id"] == session_id
    assert len(detail_data["questions"]) == 1
    assert detail_data["questions"][0]["id"] == question_id
    print("[OK] Get Session Detail passed")

    # 7. Complete Session
    complete_response = client.post(f"/sessions/{session_id}/complete")
    assert complete_response.status_code == 200
    complete_data = complete_response.json()
    assert complete_data["id"] == session_id
    assert complete_data["is_completed"] is True
    print("[OK] Complete Session passed")

    print("\n*** ALL BACKEND API TESTS PASSED SUCCESSFULLY! ***")

if __name__ == "__main__":
    try:
        run_tests()
    except AssertionError as e:
        print(f"[ERROR] Assertion Error: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Unexpected Error: {str(e)}")
        sys.exit(1)
