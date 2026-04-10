import os
os.environ["TESTING"] = "true"
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

from main import app
from database import Base, get_db

# Load .env so TEST_DATABASE_URL is available
load_dotenv()

# Separate database for tests — keeps test data isolated from development data
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    raise RuntimeError("TEST_DATABASE_URL is not set in .env")
engine = create_engine(TEST_DATABASE_URL)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Replaces the production DB session with the test DB session."""
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


# Redirect all DB calls in the app to the test database for the duration of the tests
app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    # autouse=True applies this fixture to every test automatically
    # Tables are created fresh before each test and fully dropped after — guarantees isolation
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# ========== AUTH TESTS ==========

def test_register_success():
    res = client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@mail.com",
        "password": "test123456",
    })
    assert res.status_code == 200
    assert res.json()["username"] == "testuser"
    assert res.json()["email"] == "test@mail.com"
    assert "hashed_password" not in res.json()  # password must never be exposed in the response


def test_register_duplicate_username():
    client.post("/auth/register", json={
        "username": "sameuser",
        "email": "first@mail.com",
        "password": "test123456",
    })
    res = client.post("/auth/register", json={
        "username": "sameuser",
        "email": "second@mail.com",
        "password": "test123456",
    })
    assert res.status_code == 400
    assert "Username already taken" in res.json()["detail"]


def test_register_duplicate_email():
    client.post("/auth/register", json={
        "username": "user1",
        "email": "same@mail.com",
        "password": "test123456",
    })
    res = client.post("/auth/register", json={
        "username": "user2",
        "email": "same@mail.com",
        "password": "test123456",
    })
    assert res.status_code == 400
    assert "Email already registered" in res.json()["detail"]


def test_register_short_password():
    res = client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@mail.com",
        "password": "123",
    })
    assert res.status_code == 422


def test_login_success():
    client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@mail.com",
        "password": "test123456",
    })
    res = client.post("/auth/login", json={
        "email": "test@mail.com",
        "password": "test123456",
    })
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert res.json()["token_type"] == "bearer"


def test_login_wrong_password():
    client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@mail.com",
        "password": "test123456",
    })
    res = client.post("/auth/login", json={
        "email": "test@mail.com",
        "password": "wrongpassword",
    })
    assert res.status_code == 401
    assert "Invalid credentials" in res.json()["detail"]


def test_me_with_token():
    client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@mail.com",
        "password": "test123456",
    })
    login = client.post("/auth/login", json={
        "email": "test@mail.com",
        "password": "test123456",
    })
    token = login.json()["access_token"]
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["username"] == "testuser"


def test_me_without_token():
    res = client.get("/auth/me")
    assert res.status_code in (401, 403)


def test_me_with_invalid_token():
    res = client.get("/auth/me", headers={"Authorization": "Bearer this.is.not.a.valid.token"})
    assert res.status_code == 401


# ========== LIBRARY TESTS ==========

def get_token():
    # Helper that registers a user and returns a valid JWT — reused across library tests
    client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@mail.com",
        "password": "test123456",
    })
    login = client.post("/auth/login", json={
        "email": "test@mail.com",
        "password": "test123456",
    })
    return login.json()["access_token"]


def test_add_game_to_library():
    token = get_token()
    # NOTE: This test makes a real HTTP request to the IGDB API.
    # It requires a valid Twitch token in the environment and an active internet connection.
    res = client.post("/library/", json={
        "game_id": 1022,
        "status": "Playing",
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["game_id"] == 1022
    assert res.json()["status"] == "Playing"


def test_add_duplicate_game():
    token = get_token()
    client.post("/library/", json={
        "game_id": 1022,
        "status": "Playing",
    }, headers={"Authorization": f"Bearer {token}"})
    res = client.post("/library/", json={
        "game_id": 1022,
        "status": "Completed",
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400
    assert "already in library" in res.json()["detail"].lower()


def test_get_library():
    token = get_token()
    client.post("/library/", json={
        "game_id": 1022,
        "status": "Playing",
    }, headers={"Authorization": f"Bearer {token}"})
    res = client.get("/library/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_update_game_status():
    token = get_token()
    client.post("/library/", json={
        "game_id": 1022,
        "status": "Playing",
    }, headers={"Authorization": f"Bearer {token}"})
    res = client.put("/library/1022", json={
        "status": "Completed",
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "Completed"


def test_delete_game():
    token = get_token()
    client.post("/library/", json={
        "game_id": 1022,
        "status": "Playing",
    }, headers={"Authorization": f"Bearer {token}"})
    res = client.delete("/library/1022", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    library = client.get("/library/", headers={"Authorization": f"Bearer {token}"})
    assert len(library.json()) == 0


def test_library_without_token():
    res = client.get("/library/")
    assert res.status_code == 401


def test_invalid_status():
    token = get_token()
    res = client.post("/library/", json={
        "game_id": 1022,
        "status": "banana",
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 422


def test_update_nonexistent_game():
    token = get_token()
    res = client.put("/library/9999999", json={
        "status": "Completed",
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 404
    assert "not in library" in res.json()["detail"].lower()


def test_delete_nonexistent_game():
    token = get_token()
    res = client.delete("/library/9999999", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 404
    assert "not in library" in res.json()["detail"].lower()


def test_invalid_rating():
    token = get_token()
    res = client.post("/library/", json={
        "game_id": 1022,
        "status": "Playing",
        "rating": 99,
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 422