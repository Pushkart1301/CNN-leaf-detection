import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger("agriverse_mongo")

ROOT_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT_DIR / ".env"
DB_NAME = os.getenv("MONGODB_DB_NAME", "agriverse_db")
PASSWORD_HASH_ALGO = "scrypt"
DEFAULT_AI_TOKENS = 100000

mongo_client = None
db = None
_env_loaded = False
_auth_secret = None
_memory_store = {"users": [], "collections_ready": False}


def _ensure_demo_user_exists() -> None:
    if _memory_find_user("demo") or _memory_find_user("demo@agritech.com"):
        return

    try:
        _create_memory_user("demo", "demo@agritech.com", "demo12345")
    except ValueError:
        pass


def _load_local_env() -> None:
    global _env_loaded
    if _env_loaded or not ENV_PATH.exists():
        return

    try:
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    finally:
        _env_loaded = True


_load_local_env()


def _get_auth_secret() -> str:
    global _auth_secret
    if _auth_secret:
        return _auth_secret

    secret = os.getenv("AUTH_SECRET_KEY")
    if not secret:
        secret = secrets.token_urlsafe(48)
        logger.warning("AUTH_SECRET_KEY is not set; using a process-local fallback secret.")

    _auth_secret = secret
    return secret


def _normalize_username(username: str) -> str:
    return username.strip().lower()


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash_password(password: str, salt: Optional[bytes] = None) -> str:
    salt = salt or secrets.token_bytes(16)
    key = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=16384,
        r=8,
        p=1,
        dklen=64,
    )
    return f"{PASSWORD_HASH_ALGO}${base64.b64encode(salt).decode()}${base64.b64encode(key).decode()}"


def _verify_password(password: str, password_hash: str) -> bool:
    try:
        algo, salt_b64, key_b64 = password_hash.split("$", 2)
        if algo != PASSWORD_HASH_ALGO:
            return False
        salt = base64.b64decode(salt_b64.encode())
        expected_key = base64.b64decode(key_b64.encode())
        candidate_key = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=16384,
            r=8,
            p=1,
            dklen=len(expected_key),
        )
        return hmac.compare_digest(candidate_key, expected_key)
    except Exception:
        return False


def _base_user_doc(username: str, email: str, password: str) -> Dict[str, Any]:
    now = _timestamp()
    return {
        "username": username.strip(),
        "username_normalized": _normalize_username(username),
        "name": username.strip(),
        "email": _normalize_email(email),
        "password_hash": _hash_password(password),
        "auth_provider": "username_password",
        "role": "Farmer / Agronomist",
        "title": "Enterprise Farmer",
        "farm_location": "Vellore, Tamil Nadu",
        "farm_size": "12.45 Acres",
        "crop_primary": "Paddy (Rice)",
        "ai_tokens": DEFAULT_AI_TOKENS,
        "created_at": now,
        "updated_at": now,
    }


def _serialize_user(doc: Dict[str, Any]) -> Dict[str, Any]:
    display_name = doc.get("username") or doc.get("name") or doc.get("email", "")
    user_id = str(doc.get("_id", doc.get("id", "")))
    return {
        "id": user_id,
        "username": doc.get("username", display_name),
        "displayName": display_name,
        "fullName": display_name,
        "email": doc.get("email", ""),
        "provider": "Username & Password Auth",
        "role": doc.get("role", "Farmer / Agronomist"),
        "title": doc.get("title", "Enterprise Farmer"),
        "farmLocation": doc.get("farm_location", "Vellore, Tamil Nadu"),
        "farmSize": doc.get("farm_size", "12.45 Acres"),
        "cropPrimary": doc.get("crop_primary", "Paddy (Rice)"),
        "aiTokens": f"{int(doc.get('ai_tokens', DEFAULT_AI_TOKENS)):,} / {DEFAULT_AI_TOKENS:,}",
        "createdAt": doc.get("created_at"),
        "updatedAt": doc.get("updated_at"),
        "authMethod": "Username & Password Auth",
        "photoUrl": None,
        "online": True,
    }


def _ensure_mongo_collections(connection_db) -> None:
    for collection_name in ["users", "crop_records", "soil_samples", "chat_sessions", "scheme_applications"]:
        if collection_name not in connection_db.list_collection_names():
            connection_db.create_collection(collection_name)

    users = connection_db["users"]
    users.create_index("username_normalized", unique=True)
    users.create_index("email", unique=True)


def init_mongo_connection(uri: Optional[str] = None) -> bool:
    global mongo_client, db
    connection_uri = uri or os.getenv("MONGODB_URI")

    if not connection_uri:
        logger.info("MONGODB_URI is not configured. Using the in-memory auth fallback.")
        _ensure_demo_user_exists()
        return False

    try:
        from pymongo import MongoClient

        mongo_client = MongoClient(connection_uri, serverSelectionTimeoutMS=5000)
        mongo_client.admin.command("ping")
        db = mongo_client[DB_NAME]
        _ensure_mongo_collections(db)
        logger.info("Connected to MongoDB database %s", DB_NAME)
        return True
    except Exception as exc:
        logger.warning("MongoDB connection failed: %s. Falling back to in-memory auth storage.", exc)
        if mongo_client is not None:
            try:
                mongo_client.close()
            except Exception:
                pass
        mongo_client = None
        db = None
        _ensure_demo_user_exists()
        return False


def get_db():
    global db
    if db is None:
        init_mongo_connection()
    return db


def _memory_find_user(identifier: str) -> Optional[Dict[str, Any]]:
    if not identifier:
        return None
    lookup = identifier.strip().lower()
    for user in _memory_store["users"]:
        if user["username_normalized"] == lookup or user["email"] == lookup:
            return user
    return None


def _create_memory_user(username: str, email: str, password: str) -> Dict[str, Any]:
    if _memory_find_user(username) or _memory_find_user(email):
        raise ValueError("A user with this username or email already exists.")
    user = _base_user_doc(username, email, password)
    user["id"] = f"mem_{secrets.token_hex(12)}"
    _memory_store["users"].append(user)
    return user


def register_user(username: str, email: str, password: str) -> Dict[str, Any]:
    username = (username or "").strip()
    email = (email or "").strip()
    password = password or ""

    if len(username) < 3:
        raise ValueError("Username must be at least 3 characters long.")
    if "@" not in email or "." not in email:
        raise ValueError("Please provide a valid email address.")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")

    connection = get_db()
    if connection is None:
        return _serialize_user(_create_memory_user(username, email, password))

    users = connection["users"]
    normalized_username = _normalize_username(username)
    normalized_email = _normalize_email(email)
    if users.find_one({"$or": [{"username_normalized": normalized_username}, {"email": normalized_email}]}):
        raise ValueError("A user with this username or email already exists.")

    user_doc = _base_user_doc(username, email, password)
    result = users.insert_one(user_doc)
    stored = users.find_one({"_id": result.inserted_id})
    return _serialize_user(stored or user_doc)


def authenticate_user(username_or_email: str, password: str) -> Dict[str, Any]:
    identifier = (username_or_email or "").strip()
    password = password or ""
    if not identifier or not password:
        raise ValueError("Username/email and password are required.")

    connection = get_db()
    if connection is None:
        _ensure_demo_user_exists()
        user = _memory_find_user(identifier)
        if not user or not _verify_password(password, user["password_hash"]):
            raise ValueError("Invalid username/email or password.")
        return _serialize_user(user)

    users = connection["users"]
    lookup = identifier.lower()
    user = users.find_one({"$or": [{"username_normalized": lookup}, {"email": lookup}]})
    if not user or not _verify_password(password, user.get("password_hash", "")):
        raise ValueError("Invalid username/email or password.")
    return _serialize_user(user)


def _encode_token(payload: Dict[str, Any]) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_bytes = base64.urlsafe_b64encode(json.dumps(header, separators=(",", ":")).encode()).rstrip(b"=")
    payload_bytes = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=")
    signing_input = b".".join([header_bytes, payload_bytes])
    signature = hmac.new(_get_auth_secret().encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_bytes = base64.urlsafe_b64encode(signature).rstrip(b"=")
    return b".".join([header_bytes, payload_bytes, signature_bytes]).decode("utf-8")


def _decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_signature = hmac.new(_get_auth_secret().encode("utf-8"), signing_input, hashlib.sha256).digest()
        received_signature = base64.urlsafe_b64decode(signature_b64 + "==")
        if not hmac.compare_digest(expected_signature, received_signature):
            return None
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + "==").decode("utf-8"))
        expires_at = payload.get("exp")
        if expires_at and datetime.fromtimestamp(expires_at, tz=timezone.utc) < datetime.now(timezone.utc):
            return None
        return payload
    except Exception:
        return None


def create_access_token(user_id: str, expires_minutes: int = 60 * 24 * 7) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }
    return _encode_token(payload)


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    connection = get_db()
    if connection is None:
        for user in _memory_store["users"]:
            if str(user.get("id")) == str(user_id):
                return _serialize_user(user)
        return None

    from bson import ObjectId

    users = connection["users"]
    user = None
    try:
        user = users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = users.find_one({"id": user_id})
    if not user:
        return None
    return _serialize_user(user)


def get_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    payload = _decode_token(token)
    if not payload:
        return None
    return get_user_by_id(payload.get("sub", ""))


def make_auth_payload(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "status": "success",
        "token": create_access_token(user["id"]),
        "token_type": "bearer",
        "user": user,
    }
