"""Backend tests for Invitaciones API."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://invite-designer-31.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def created_invitation():
    payload = {
        "theme": "princesas",
        "child_name": "TEST_Sofia",
        "age": 6,
        "event_date": "2026-06-15",
        "event_time": "16:00",
        "venue": "Salón Test",
        "address": "Calle Falsa 123",
        "whatsapp": "5215555555555",
    }
    r = requests.post(f"{API}/invitations", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "id" in data and "edit_token" in data
    return data


# --- Create ---
class TestCreate:
    def test_create_valid(self, created_invitation):
        assert isinstance(created_invitation["id"], str)
        assert len(created_invitation["edit_token"]) > 5

    def test_create_invalid_theme(self):
        r = requests.post(f"{API}/invitations", json={
            "theme": "invalidtheme", "child_name": "X", "age": 5,
            "event_date": "2026-01-01", "event_time": "10:00"
        })
        assert r.status_code == 400

    def test_create_missing_required(self):
        r = requests.post(f"{API}/invitations", json={"theme": "espacio"})
        assert r.status_code == 422


# --- Public GET ---
class TestGetPublic:
    def test_get_public_hides_secrets(self, created_invitation):
        r = requests.get(f"{API}/invitations/{created_invitation['id']}")
        assert r.status_code == 200
        data = r.json()
        assert "edit_token" not in data
        assert "script_url" not in data
        assert data["child_name"] == "TEST_Sofia"
        assert data["theme"] == "princesas"

    def test_get_public_404(self):
        r = requests.get(f"{API}/invitations/nonexistent-id-xyz")
        assert r.status_code == 404


# --- Edit GET ---
class TestEditGet:
    def test_edit_valid_token(self, created_invitation):
        r = requests.get(f"{API}/invitations/{created_invitation['id']}/edit",
                         params={"token": created_invitation["edit_token"]})
        assert r.status_code == 200
        data = r.json()
        assert data["edit_token"] == created_invitation["edit_token"]

    def test_edit_invalid_token(self, created_invitation):
        r = requests.get(f"{API}/invitations/{created_invitation['id']}/edit",
                         params={"token": "wrongtoken"})
        assert r.status_code == 403


# --- PUT ---
class TestUpdate:
    def test_update_valid_token(self, created_invitation):
        payload = {
            "theme": "dinosaurios",
            "child_name": "TEST_Sofia_Updated",
            "age": 7,
            "event_date": "2026-07-20",
            "event_time": "17:00",
        }
        r = requests.put(f"{API}/invitations/{created_invitation['id']}",
                         params={"token": created_invitation["edit_token"]}, json=payload)
        assert r.status_code == 200
        assert r.json()["ok"] is True

        # Verify persistence
        g = requests.get(f"{API}/invitations/{created_invitation['id']}")
        assert g.json()["child_name"] == "TEST_Sofia_Updated"
        assert g.json()["theme"] == "dinosaurios"

    def test_update_invalid_token(self, created_invitation):
        r = requests.put(f"{API}/invitations/{created_invitation['id']}",
                         params={"token": "badtoken"}, json={
                             "theme": "espacio", "child_name": "X", "age": 5,
                             "event_date": "2026-01-01", "event_time": "10:00"
                         })
        assert r.status_code == 403


# --- RSVP ---
class TestRsvp:
    def test_create_rsvp(self, created_invitation):
        r = requests.post(f"{API}/invitations/{created_invitation['id']}/rsvp", json={
            "nombre": "TEST_Pedro",
            "telefono": "5215551234567",
            "asiste": "Sí",
            "adultos": 2,
            "ninos": 1,
            "mensaje": "Ahí estaremos",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["sheet_forwarded"] is False  # No script_url set

    def test_rsvp_invitation_not_found(self):
        r = requests.post(f"{API}/invitations/nonexistent-xyz/rsvp",
                          json={"nombre": "X"})
        assert r.status_code == 404
