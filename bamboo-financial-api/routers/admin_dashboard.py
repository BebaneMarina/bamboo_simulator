# admin_dashboard.py
from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api/admin/dashboard", tags=["Admin Dashboard"])

@router.get("/stats")
async def get_dashboard_stats():
    return {
        "total_banks": 12,
        "active_banks": 10,
        "total_insurance_companies": 8,
        "active_insurance_companies": 6,
        "total_products": 42,
        "active_products": 35,
        "total_users": 1200,
        "active_users": 1100
    }

@router.get("/recent-activity")
async def get_recent_activity(limit: int = 20):
    activities = [
        {"id": 1, "type": "login", "user": "admin1", "time": datetime.now().isoformat()},
        {"id": 2, "type": "create_bank", "user": "admin2", "time": datetime.now().isoformat()},
        {"id": 3, "type": "update_insurance", "user": "admin1", "time": datetime.now().isoformat()},
    ]
    return {"activities": activities[:limit]}

# Module séparé pour insurance
insurance_router = APIRouter(prefix="/api/admin/insurance", tags=["Admin Insurance"])

@insurance_router.get("/stats")
async def get_insurance_stats():
    return {
        "total_contracts": 78,
        "active": 65,
        "expired": 13,
        "claims": 5
    }
