"""
conftest.py — Shared fixtures for all backend tests.

Strategy:
- ใช้ SQLite in-memory (:memory:) แทน PostgreSQL เพื่อให้รันได้เร็วและไม่ต้องการ DB server
- สร้างตารางทุกตารางจาก SQLAlchemy models ก่อนเริ่ม test session
- ทุก test ได้รับ DB session ที่ rollback หลังแต่ละ test (ป้องกัน state pollution)
- ใช้ httpx.AsyncClient แทน requests เพื่อรองรับ FastAPI async routes
"""

import pytest
import pytest_asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient, ASGITransport

# ต้องนำเข้า Base และ Models ทั้งหมดก่อนสร้างตาราง
from database import Base, get_db
from models.user import User
from models.inventory import InventoryItem
from models.recipe import RecipeSaved, CachedResponse
from models.nutrition import NutritionLog
from models.recipe_cache import RecipeCache
from models.translation import Translation
from models.chat import ChatHistory

# นำเข้า FastAPI app
from main import app

# -------------------------------------------------
# 1. SQLite In-Memory Engine (สร้างครั้งเดียวต่อ session)
# -------------------------------------------------
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    """สร้างตาราง SQLite ทั้งหมดก่อนรัน test session"""
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)


# -------------------------------------------------
# 2. DB Session Fixture (rollback หลังแต่ละ test)
# -------------------------------------------------
@pytest.fixture()
def db_session():
    """DB session ที่ rollback ทุกสิ้น test เพื่อป้องกัน data pollution"""
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


# -------------------------------------------------
# 3. Override get_db Dependency
# -------------------------------------------------
@pytest.fixture()
def override_db(db_session):
    """Override FastAPI dependency get_db ให้ใช้ SQLite test session"""
    def _get_test_db():
        yield db_session

    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.clear()


# -------------------------------------------------
# 4. HTTP Client Fixture (ไม่ต้องการ Auth)
# -------------------------------------------------
@pytest_asyncio.fixture()
async def client(override_db):
    """AsyncClient ที่ผูกกับ FastAPI ASGI โดยตรง (ไม่ต้องรัน server จริง)"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


# -------------------------------------------------
# 5. Auth Helpers — สร้าง user และ token สำหรับ test
# -------------------------------------------------
@pytest.fixture()
def test_user(db_session):
    """สร้าง test user ใน DB โดยตรง (ข้าม API)"""
    import bcrypt
    hashed = bcrypt.hashpw(b"testpassword", bcrypt.gensalt()).decode()
    user = User(username="testuser@test.com", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def test_user_b(db_session):
    """สร้าง user คนที่ 2 สำหรับ cross-user isolation tests"""
    import bcrypt
    hashed = bcrypt.hashpw(b"testpassword2", bcrypt.gensalt()).decode()
    user = User(username="userb@test.com", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def auth_token(test_user):
    """ออก JWT token สำหรับ test_user โดยตรง"""
    from routers.auth import create_access_token
    return create_access_token(data={"sub": test_user.username})


@pytest.fixture()
def auth_token_b(test_user_b):
    """ออก JWT token สำหรับ test_user_b"""
    from routers.auth import create_access_token
    return create_access_token(data={"sub": test_user_b.username})


@pytest.fixture()
def auth_headers(auth_token):
    """HTTP headers พร้อม Bearer token ของ test_user"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture()
def auth_headers_b(auth_token_b):
    """HTTP headers พร้อม Bearer token ของ test_user_b"""
    return {"Authorization": f"Bearer {auth_token_b}"}


# -------------------------------------------------
# 6. Inventory Item Helper
# -------------------------------------------------
@pytest.fixture()
def inventory_item(db_session, test_user):
    """สร้าง inventory item ใน DB โดยตรงสำหรับ test ที่ต้องการ pre-existing item"""
    item = InventoryItem(
        user_id=test_user.id,
        name="ไข่ไก่",
        quantity=5.0,
        unit="ฟอง",
        category="protein",
        added_by="manual",
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item
