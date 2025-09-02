# routers/admin_management.py - Système de gestion des administrateurs
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from passlib.context import CryptContext
import uuid
import json

from database import get_db
from models import AdminUser, Bank, InsuranceCompany, AuditLog
from routers.auth_router import get_current_admin, verify_super_admin

router = APIRouter(prefix="/api/admin/management", tags=["admin_management"])

# Configuration pour le hashage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# ==================== SCHEMAS PYDANTIC ====================

class AdminUserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., description="Role: bank_admin, insurance_admin, moderator")
    
    # Assignation spécifique
    assigned_bank_id: Optional[str] = None
    assigned_insurance_company_id: Optional[str] = None
    
    # Permissions spécifiques
    can_create_products: bool = True
    can_edit_products: bool = True
    can_delete_products: bool = True
    can_view_simulations: bool = True
    can_manage_applications: bool = True
    
    is_active: bool = True

class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    role: Optional[str] = None
    assigned_bank_id: Optional[str] = None
    assigned_insurance_company_id: Optional[str] = None
    can_create_products: Optional[bool] = None
    can_edit_products: Optional[bool] = None
    can_delete_products: Optional[bool] = None
    can_view_simulations: Optional[bool] = None
    can_manage_applications: Optional[bool] = None
    is_active: Optional[bool] = None

class AdminUserResponse(BaseModel):
    id: str
    username: str
    email: str
    first_name: str
    last_name: str
    role: str
    assigned_bank: Optional[Dict] = None
    assigned_insurance_company: Optional[Dict] = None
    permissions: Dict
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

# ==================== UTILITAIRES ====================

def build_permissions(admin_data: AdminUserCreate) -> Dict:
    """Construire l'objet permissions"""
    return {
        "products": {
            "create": admin_data.can_create_products,
            "read": True,  # Toujours autorisé
            "update": admin_data.can_edit_products,
            "delete": admin_data.can_delete_products
        },
        "simulations": {
            "read": admin_data.can_view_simulations
        },
        "applications": {
            "manage": admin_data.can_manage_applications
        }
    }

def log_admin_action(db: Session, admin_id: str, action: str, entity_type: str, entity_id: str = None, old_values: Dict = None, new_values: Dict = None):
    """Logger une action d'administration"""
    try:
        audit_log = AuditLog(
            id=str(uuid.uuid4()),
            admin_user_id=admin_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values,
            created_at=datetime.now()
        )
        db.add(audit_log)
        db.commit()
    except Exception as e:
        print(f"Erreur logging audit: {e}")

# ==================== ENDPOINTS ====================

@router.get("/admins")
async def get_all_admins(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    institution_type: Optional[str] = Query(None),  # bank ou insurance
    is_active: Optional[bool] = Query(None),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Récupérer tous les administrateurs (Super Admin uniquement)"""
    verify_super_admin(current_admin)
    
    try:
        query = db.query(AdminUser).options(
            joinedload(AdminUser.assigned_bank),
            joinedload(AdminUser.assigned_insurance_company)
        ).filter(AdminUser.role != 'super_admin')  # Exclure les super admins
        
        # Filtres
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    AdminUser.username.ilike(search_term),
                    AdminUser.first_name.ilike(search_term),
                    AdminUser.last_name.ilike(search_term),
                    AdminUser.email.ilike(search_term)
                )
            )
        
        if role:
            query = query.filter(AdminUser.role == role)
        
        if institution_type == 'bank':
            query = query.filter(AdminUser.assigned_bank_id.isnot(None))
        elif institution_type == 'insurance':
            query = query.filter(AdminUser.assigned_insurance_company_id.isnot(None))
        
        if is_active is not None:
            query = query.filter(AdminUser.is_active == is_active)
        
        # Pagination
        total = query.count()
        admins = query.order_by(desc(AdminUser.created_at)).offset(skip).limit(limit).all()
        
        # Formatage des résultats
        result_admins = []
        for admin in admins:
            permissions = admin.permissions if isinstance(admin.permissions, dict) else {}
            
            assigned_bank = None
            if admin.assigned_bank:
                assigned_bank = {
                    "id": admin.assigned_bank.id,
                    "name": admin.assigned_bank.name,
                    "full_name": admin.assigned_bank.full_name
                }
            
            assigned_insurance = None
            if admin.assigned_insurance_company:
                assigned_insurance = {
                    "id": admin.assigned_insurance_company.id,
                    "name": admin.assigned_insurance_company.name,
                    "full_name": admin.assigned_insurance_company.full_name
                }
            
            result_admins.append({
                "id": admin.id,
                "username": admin.username,
                "email": admin.email,
                "first_name": admin.first_name,
                "last_name": admin.last_name,
                "role": admin.role,
                "assigned_bank": assigned_bank,
                "assigned_insurance_company": assigned_insurance,
                "permissions": permissions,
                "is_active": admin.is_active,
                "last_login": admin.last_login,
                "created_at": admin.created_at,
                "updated_at": admin.updated_at
            })
        
        return {
            "admins": result_admins,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        print(f"Erreur get_all_admins: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des administrateurs")

@router.get("/admins/{admin_id}")
async def get_admin(
    admin_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Récupérer un administrateur spécifique"""
    verify_super_admin(current_admin)
    
    try:
        admin = db.query(AdminUser).options(
            joinedload(AdminUser.assigned_bank),
            joinedload(AdminUser.assigned_insurance_company)
        ).filter(AdminUser.id == admin_id).first()
        
        if not admin:
            raise HTTPException(status_code=404, detail="Administrateur non trouvé")
        
        permissions = admin.permissions if isinstance(admin.permissions, dict) else {}
        
        assigned_bank = None
        if admin.assigned_bank:
            assigned_bank = {
                "id": admin.assigned_bank.id,
                "name": admin.assigned_bank.name,
                "full_name": admin.assigned_bank.full_name
            }
        
        assigned_insurance = None
        if admin.assigned_insurance_company:
            assigned_insurance = {
                "id": admin.assigned_insurance_company.id,
                "name": admin.assigned_insurance_company.name,
                "full_name": admin.assigned_insurance_company.full_name
            }
        
        return {
            "id": admin.id,
            "username": admin.username,
            "email": admin.email,
            "first_name": admin.first_name,
            "last_name": admin.last_name,
            "role": admin.role,
            "assigned_bank": assigned_bank,
            "assigned_insurance_company": assigned_insurance,
            "permissions": permissions,
            "is_active": admin.is_active,
            "last_login": admin.last_login,
            "created_at": admin.created_at,
            "updated_at": admin.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur get_admin: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération de l'administrateur")

@router.post("/admins")
async def create_admin(
    admin_data: AdminUserCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Créer un nouvel administrateur"""
    verify_super_admin(current_admin)
    
    try:
        # Vérifications d'unicité
        existing_username = db.query(AdminUser).filter(AdminUser.username == admin_data.username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Ce nom d'utilisateur existe déjà")
        
        existing_email = db.query(AdminUser).filter(AdminUser.email == admin_data.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Cette adresse email existe déjà")
        
        # Validations selon le rôle
        if admin_data.role == 'bank_admin':
            if not admin_data.assigned_bank_id:
                raise HTTPException(status_code=400, detail="Une banque doit être assignée pour un admin bancaire")
            
            # Vérifier que la banque existe
            bank = db.query(Bank).filter(Bank.id == admin_data.assigned_bank_id).first()
            if not bank:
                raise HTTPException(status_code=400, detail="Banque non trouvée")
            
            admin_data.assigned_insurance_company_id = None
            
        elif admin_data.role == 'insurance_admin':
            if not admin_data.assigned_insurance_company_id:
                raise HTTPException(status_code=400, detail="Une compagnie d'assurance doit être assignée")
            
            # Vérifier que la compagnie existe
            insurance_company = db.query(InsuranceCompany).filter(
                InsuranceCompany.id == admin_data.assigned_insurance_company_id
            ).first()
            if not insurance_company:
                raise HTTPException(status_code=400, detail="Compagnie d'assurance non trouvée")
            
            admin_data.assigned_bank_id = None
            
        elif admin_data.role == 'moderator':
            admin_data.assigned_bank_id = None
            admin_data.assigned_insurance_company_id = None
        
        # Hasher le mot de passe
        hashed_password = hash_password(admin_data.password)
        
        # Construire les permissions
        permissions = build_permissions(admin_data)
        
        # Créer l'administrateur
        new_admin = AdminUser(
            id=str(uuid.uuid4()),
            username=admin_data.username,
            email=admin_data.email,
            password_hash=hashed_password,
            first_name=admin_data.first_name,
            last_name=admin_data.last_name,
            role=admin_data.role,
            assigned_bank_id=admin_data.assigned_bank_id,
            assigned_insurance_company_id=admin_data.assigned_insurance_company_id,
            permissions=permissions,
            is_active=admin_data.is_active,
            created_by=current_admin.id,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        
        # Logger l'action
        log_admin_action(
            db, current_admin.id, "CREATE", "admin_user", new_admin.id,
            None, {"username": new_admin.username, "role": new_admin.role}
        )
        
        return {
            "message": "Administrateur créé avec succès",
            "admin": {
                "id": new_admin.id,
                "username": new_admin.username,
                "email": new_admin.email,
                "role": new_admin.role,
                "is_active": new_admin.is_active
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erreur create_admin: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la création de l'administrateur")

@router.put("/admins/{admin_id}")
async def update_admin(
    admin_id: str,
    admin_data: AdminUserUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Mettre à jour un administrateur"""
    verify_super_admin(current_admin)
    
    try:
        admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
        if not admin:
            raise HTTPException(status_code=404, detail="Administrateur non trouvé")
        
        if admin.role == 'super_admin':
            raise HTTPException(status_code=403, detail="Impossible de modifier un super administrateur")
        
        # Stocker les anciennes valeurs pour l'audit
        old_values = {
            "username": admin.username,
            "email": admin.email,
            "role": admin.role,
            "is_active": admin.is_active
        }
        
        # Vérifications d'unicité si email modifié
        if admin_data.email and admin_data.email != admin.email:
            existing_email = db.query(AdminUser).filter(
                AdminUser.email == admin_data.email,
                AdminUser.id != admin_id
            ).first()
            if existing_email:
                raise HTTPException(status_code=400, detail="Cette adresse email existe déjà")
        
        # Mise à jour des champs
        update_data = admin_data.dict(exclude_unset=True)
        
        # Traitement spécial pour le mot de passe
        if 'password' in update_data and update_data['password']:
            update_data['password_hash'] = hash_password(update_data['password'])
            del update_data['password']
        
        # Validations selon le rôle
        if 'role' in update_data:
            new_role = update_data['role']
            
            if new_role == 'bank_admin':
                if not update_data.get('assigned_bank_id') and not admin.assigned_bank_id:
                    raise HTTPException(status_code=400, detail="Une banque doit être assignée")
                update_data['assigned_insurance_company_id'] = None
                
            elif new_role == 'insurance_admin':
                if not update_data.get('assigned_insurance_company_id') and not admin.assigned_insurance_company_id:
                    raise HTTPException(status_code=400, detail="Une compagnie d'assurance doit être assignée")
                update_data['assigned_bank_id'] = None
                
            elif new_role == 'moderator':
                update_data['assigned_bank_id'] = None
                update_data['assigned_insurance_company_id'] = None
        
        # Mise à jour des permissions si nécessaire
        if any(key.startswith('can_') for key in update_data.keys()):
            current_permissions = admin.permissions if isinstance(admin.permissions, dict) else {}
            
            # Mettre à jour les permissions
            if 'can_create_products' in update_data:
                current_permissions.setdefault('products', {})['create'] = update_data['can_create_products']
                del update_data['can_create_products']
            
            if 'can_edit_products' in update_data:
                current_permissions.setdefault('products', {})['update'] = update_data['can_edit_products']
                del update_data['can_edit_products']
            
            if 'can_delete_products' in update_data:
                current_permissions.setdefault('products', {})['delete'] = update_data['can_delete_products']
                del update_data['can_delete_products']
            
            if 'can_view_simulations' in update_data:
                current_permissions.setdefault('simulations', {})['read'] = update_data['can_view_simulations']
                del update_data['can_view_simulations']
            
            if 'can_manage_applications' in update_data:
                current_permissions.setdefault('applications', {})['manage'] = update_data['can_manage_applications']
                del update_data['can_manage_applications']
            
            update_data['permissions'] = current_permissions
        
        # Appliquer les mises à jour
        for key, value in update_data.items():
            setattr(admin, key, value)
        
        admin.updated_at = datetime.now()
        
        db.commit()
        db.refresh(admin)
        
        # Logger l'action
        new_values = {
            "username": admin.username,
            "email": admin.email,
            "role": admin.role,
            "is_active": admin.is_active
        }
        
        log_admin_action(
            db, current_admin.id, "UPDATE", "admin_user", admin.id,
            old_values, new_values
        )
        
        return {
            "message": "Administrateur mis à jour avec succès",
            "admin": {
                "id": admin.id,
                "username": admin.username,
                "email": admin.email,
                "role": admin.role,
                "is_active": admin.is_active,
                "updated_at": admin.updated_at
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erreur update_admin: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour")

@router.delete("/admins/{admin_id}")
async def delete_admin(
    admin_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Supprimer un administrateur"""
    verify_super_admin(current_admin)
    
    try:
        admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
        if not admin:
            raise HTTPException(status_code=404, detail="Administrateur non trouvé")
        
        if admin.role == 'super_admin':
            raise HTTPException(status_code=403, detail="Impossible de supprimer un super administrateur")
        
        if admin.id == current_admin.id:
            raise HTTPException(status_code=403, detail="Vous ne pouvez pas vous supprimer vous-même")
        
        # Stocker les informations pour l'audit
        admin_info = {
            "username": admin.username,
            "email": admin.email,
            "role": admin.role
        }
        
        db.delete(admin)
        db.commit()
        
        # Logger l'action
        log_admin_action(
            db, current_admin.id, "DELETE", "admin_user", admin_id,
            admin_info, None
        )
        
        return {"message": f"Administrateur '{admin_info['username']}' supprimé avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erreur delete_admin: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression")

@router.get("/institutions")
async def get_institutions(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Récupérer la liste des institutions (banques et assurances) pour assignment"""
    verify_super_admin(current_admin)
    
    try:
        # Récupérer les banques actives
        banks = db.query(Bank).filter(Bank.is_active == True).all()
        banks_data = [
            {
                "id": bank.id,
                "name": bank.name,
                "full_name": bank.full_name,
                "type": "bank"
            } for bank in banks
        ]
        
        # Récupérer les compagnies d'assurance actives
        insurance_companies = db.query(InsuranceCompany).filter(InsuranceCompany.is_active == True).all()
        insurance_data = [
            {
                "id": company.id,
                "name": company.name,
                "full_name": company.full_name,
                "type": "insurance"
            } for company in insurance_companies
        ]
        
        return {
            "banks": banks_data,
            "insurance_companies": insurance_data,
            "total_banks": len(banks_data),
            "total_insurance": len(insurance_data)
        }
        
    except Exception as e:
        print(f"Erreur get_institutions: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des institutions")

@router.patch("/admins/{admin_id}/toggle-status")
async def toggle_admin_status(
    admin_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Activer/désactiver un administrateur"""
    verify_super_admin(current_admin)
    
    try:
        admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
        if not admin:
            raise HTTPException(status_code=404, detail="Administrateur non trouvé")
        
        if admin.role == 'super_admin':
            raise HTTPException(status_code=403, detail="Impossible de modifier le statut d'un super administrateur")
        
        old_status = admin.is_active
        admin.is_active = not admin.is_active
        admin.updated_at = datetime.now()
        
        db.commit()
        db.refresh(admin)
        
        # Logger l'action
        log_admin_action(
            db, current_admin.id, "UPDATE", "admin_user", admin.id,
            {"is_active": old_status}, {"is_active": admin.is_active}
        )
        
        status_text = "activé" if admin.is_active else "désactivé"
        return {
            "message": f"Administrateur {status_text} avec succès",
            "is_active": admin.is_active
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erreur toggle_admin_status: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du changement de statut")

@router.get("/stats")
async def get_admin_stats(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Statistiques des administrateurs"""
    verify_super_admin(current_admin)
    
    try:
        # Statistiques générales
        total_admins = db.query(AdminUser).filter(AdminUser.role != 'super_admin').count()
        active_admins = db.query(AdminUser).filter(
            AdminUser.role != 'super_admin',
            AdminUser.is_active == True
        ).count()
        
        # Par rôle
        bank_admins = db.query(AdminUser).filter(AdminUser.role == 'bank_admin').count()
        insurance_admins = db.query(AdminUser).filter(AdminUser.role == 'insurance_admin').count()
        moderators = db.query(AdminUser).filter(AdminUser.role == 'moderator').count()
        
        # Admins récents
        recent_admins = db.query(AdminUser).filter(
            AdminUser.role != 'super_admin',
            AdminUser.created_at >= datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        ).count()
        
        return {
            "total_admins": total_admins,
            "active_admins": active_admins,
            "inactive_admins": total_admins - active_admins,
            "by_role": {
                "bank_admins": bank_admins,
                "insurance_admins": insurance_admins,
                "moderators": moderators
            },
            "recent_admins": recent_admins
        }
        
    except Exception as e:
        print(f"Erreur get_admin_stats: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des statistiques")