"""Backend tests for Invitaciones API."""
import hashlib
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8000').rstrip('/')
API = f"{BASE_URL}/api"
WOMPI_EVENTS_SECRET = os.environ.get('WOMPI_EVENTS_SECRET', '')


def _approve_payment(checkout, tx_id):
    """Simulates Wompi confirming a payment, so tests exercise invitations
    in their normal post-checkout (paid) state."""
    properties = ["transaction.id", "transaction.status", "transaction.amount_in_cents"]
    data = {
        "transaction": {
            "id": tx_id,
            "reference": checkout["reference"],
            "status": "APPROVED",
            "amount_in_cents": checkout["amount_in_cents"],
            "currency": checkout["currency"],
        }
    }
    timestamp = 1710000000
    concat = "".join(str(data["transaction"][p.split(".")[1]]) for p in properties)
    concat += str(timestamp) + WOMPI_EVENTS_SECRET
    checksum = hashlib.sha256(concat.encode("utf-8")).hexdigest()
    body = {
        "event": "transaction.updated",
        "data": data,
        "signature": {"checksum": checksum, "properties": properties},
        "timestamp": timestamp,
    }
    r = requests.post(f"{API}/webhooks/wompi", json=body)
    assert r.status_code == 200, r.text


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
    assert "id" in data and "edit_token" in data and "checkout" in data
    _approve_payment(data["checkout"], tx_id=f"TEST_TX_{data['id']}")
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


# --- Video Upload ---
class TestVideoUpload:
    def test_upload_valid_video(self):
        files = {"file": ("clip.mp4", b"\x00\x00\x00\x18ftypmp42" + b"0" * 1000, "video/mp4")}
        r = requests.post(f"{API}/uploads/video", files=files)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["video_url"].startswith("/uploads/videos/")
        assert data["video_url"].endswith(".mp4")

        # The uploaded file is actually served back
        g = requests.get(f"{BASE_URL}{data['video_url']}")
        assert g.status_code == 200

    def test_upload_rejects_bad_type(self):
        files = {"file": ("evil.exe", b"MZ", "application/octet-stream")}
        r = requests.post(f"{API}/uploads/video", files=files)
        assert r.status_code == 400

    def test_invitation_rejects_external_video_url(self, created_invitation):
        payload = {
            "theme": "espacio", "child_name": "X", "age": 5,
            "event_date": "2026-01-01", "event_time": "10:00",
            "video_url": "https://evil.com/x.mp4",
        }
        r = requests.put(f"{API}/invitations/{created_invitation['id']}",
                         params={"token": created_invitation["edit_token"]}, json=payload)
        assert r.status_code == 400


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


# --- Payments / paywall ---
class TestPayments:
    def _create(self):
        payload = {
            "theme": "unicornios", "child_name": "TEST_Pago", "age": 3,
            "event_date": "2026-10-10", "event_time": "12:00",
        }
        r = requests.post(f"{API}/invitations", json=payload)
        assert r.status_code == 200, r.text
        return r.json()

    def test_create_returns_checkout(self):
        data = self._create()
        checkout = data["checkout"]
        assert checkout["reference"] == f"FIESTITA-{data['id']}"
        assert checkout["amount_in_cents"] == 59000 * 100
        assert checkout["currency"] == "COP"
        assert len(checkout["signature"]) == 64  # sha256 hex digest

    def test_unpaid_invitation_hidden_from_public_view(self):
        data = self._create()
        r = requests.get(f"{API}/invitations/{data['id']}")
        assert r.status_code == 404

    def test_paid_invitation_visible_after_webhook(self):
        data = self._create()
        _approve_payment(data["checkout"], tx_id=f"TEST_TX_PAYFLOW_{data['id']}")
        r = requests.get(f"{API}/invitations/{data['id']}")
        assert r.status_code == 200
        assert r.json()["child_name"] == "TEST_Pago"
