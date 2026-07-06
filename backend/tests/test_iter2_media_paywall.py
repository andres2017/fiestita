"""Iteration 2 backend tests: media upload, paywall (Wompi), config, webhook."""
import os
import hashlib
import io
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://invite-designer-31.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

# Wompi secrets from backend .env (needed for webhook signature test)
WOMPI_EVENTS_SECRET = "prod_events_V9d3inY16PUOFJ1k09KSUE2xmOgUTMED"
WOMPI_INTEGRITY_SECRET = "prod_integrity_HoftfktPtoqIAegarsROJmNW2iFrN3uM"
EXPECTED_PRICE = 5500000


# 1x1 JPEG bytes
JPEG_BYTES = bytes.fromhex(
    "ffd8ffe000104a46494600010101006000600000ffdb004300080606070605080707"
    "07090908"
    + "0a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434"
    + "1f27393d38323c2e333432"
    "ffdb0043010909090c0b0c180d0d1832211c213232323232323232323232323232323232"
    + "3232323232323232323232323232323232323232323232323232323232323232"
    "ffc00011080001000103012200021101031101"
    "ffc4001f0000010501010101010100000000000000000102030405060708090a0b"
    "ffc400b5100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9fa"
    "ffc4001f0100030101010101010101010000000000000102030405060708090a0b"
    "ffc400b51100020102040403040705040400010277000102031104052131061241510761711322328108144291a1b1c109233352f0156272d10a162434e125f11718191a262728292a35363738393a434445464748494a535455565758595a636465666768696a737475767778797a82838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f3f4f5f6f7f8f9fa"
    "ffda000c03010002110311003f00fbfe28a28a00ffd9"
)


@pytest.fixture(scope="module")
def unpaid_invitation():
    payload = {
        "theme": "espacio",
        "child_name": "TEST_Astro",
        "age": 6,
        "event_date": "2026-08-10",
        "event_time": "15:00",
        "venue": "Nave Test",
    }
    r = requests.post(f"{API}/invitations", json=payload)
    assert r.status_code == 200, r.text
    return r.json()


class TestConfig:
    def test_config(self):
        r = requests.get(f"{API}/config")
        assert r.status_code == 200
        d = r.json()
        assert d["price_cents"] == EXPECTED_PRICE
        assert d["currency"] == "COP"


class TestPaywallGet:
    def test_get_unpaid_returns_402(self, unpaid_invitation):
        r = requests.get(f"{API}/invitations/{unpaid_invitation['id']}")
        assert r.status_code == 402

    def test_get_edit_still_works(self, unpaid_invitation):
        r = requests.get(f"{API}/invitations/{unpaid_invitation['id']}/edit",
                         params={"token": unpaid_invitation['edit_token']})
        assert r.status_code == 200


class TestCheckout:
    def test_checkout_valid(self, unpaid_invitation):
        r = requests.post(f"{API}/invitations/{unpaid_invitation['id']}/checkout",
                          params={"token": unpaid_invitation['edit_token']})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["amount_in_cents"] == EXPECTED_PRICE
        assert d["currency"] == "COP"
        assert d["reference"].startswith("FTA-")
        assert "checkout_url" in d
        assert "public_key" in d
        # Verify signature = sha256(reference + amount + COP + integrity_secret)
        expected = hashlib.sha256(
            f"{d['reference']}{EXPECTED_PRICE}COP{WOMPI_INTEGRITY_SECRET}".encode()
        ).hexdigest()
        assert d["signature"] == expected

    def test_checkout_invalid_token(self, unpaid_invitation):
        r = requests.post(f"{API}/invitations/{unpaid_invitation['id']}/checkout",
                          params={"token": "wrong"})
        assert r.status_code == 403


class TestMediaUpload:
    def test_upload_jpeg(self):
        r = requests.post(f"{API}/media/upload",
                          files={"file": ("test.jpg", JPEG_BYTES, "image/jpeg")})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "id" in d and "path" in d
        assert d["type"] == "photo"
        # Serve back
        s = requests.get(f"{API}/media/{d['path']}")
        assert s.status_code == 200
        assert s.headers.get("content-type", "").startswith("image/jpeg")

    def test_upload_disallowed_type(self):
        r = requests.post(f"{API}/media/upload",
                          files={"file": ("bad.txt", b"hello", "text/plain")})
        assert r.status_code == 400


class TestWebhook:
    def test_invalid_checksum(self):
        body = {
            "signature": {"properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
                          "checksum": "0" * 64},
            "timestamp": int(time.time()),
            "data": {"transaction": {"id": "x", "status": "APPROVED", "amount_in_cents": EXPECTED_PRICE,
                                     "currency": "COP", "reference": "FTA-xxx"}},
        }
        r = requests.post(f"{API}/wompi/webhook", json=body)
        assert r.status_code == 403

    def test_valid_checksum_marks_paid(self, unpaid_invitation):
        # First create a checkout to get a wompi_reference
        c = requests.post(f"{API}/invitations/{unpaid_invitation['id']}/checkout",
                          params={"token": unpaid_invitation['edit_token']})
        # If already checked out earlier in TestCheckout, reference stored
        # Fetch reference via edit
        e = requests.get(f"{API}/invitations/{unpaid_invitation['id']}/edit",
                         params={"token": unpaid_invitation['edit_token']})
        assert e.status_code == 200
        reference = e.json().get("wompi_reference")
        assert reference

        tx_id = "TEST-TX-123"
        tx_status = "APPROVED"
        amount = EXPECTED_PRICE
        timestamp = int(time.time())
        concat = f"{tx_id}{tx_status}{amount}{timestamp}{WOMPI_EVENTS_SECRET}"
        checksum = hashlib.sha256(concat.encode()).hexdigest()
        body = {
            "signature": {
                "properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
                "checksum": checksum,
            },
            "timestamp": timestamp,
            "data": {"transaction": {
                "id": tx_id, "status": tx_status, "amount_in_cents": amount,
                "currency": "COP", "reference": reference,
            }},
        }
        r = requests.post(f"{API}/wompi/webhook", json=body)
        assert r.status_code == 200, r.text
        assert r.json().get("received") is True

        # Now the invitation should be paid → public GET returns 200
        g = requests.get(f"{API}/invitations/{unpaid_invitation['id']}")
        assert g.status_code == 200, g.text
        assert g.json().get("paid") is True

    def test_checkout_already_paid(self, unpaid_invitation):
        # After previous test, invitation is paid → checkout should return 400
        r = requests.post(f"{API}/invitations/{unpaid_invitation['id']}/checkout",
                          params={"token": unpaid_invitation['edit_token']})
        assert r.status_code == 400
