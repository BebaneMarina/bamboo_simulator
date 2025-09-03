# user_auth_schemas.py - Schémas Pydantic pour l'authentification utilisateur

from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime, date
from enum import Enum

# ==================== ENUMS ====================

class RegistrationMethod(str, Enum):
    EMAIL = "email"
    PHONE = "phone"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    ACTIVE = "active"
    OPENED = "opened"
    MEDICAL_EXAM_REQUIRED = "medical_exam_required"

class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

# ==================== AUTHENTIFICATION ====================

class UserRegistrationRequest(BaseModel):
    # Méthode d'inscription
    registration_method: RegistrationMethod
    
    # Informations de contact (au moins une requise)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    
    # Informations personnelles
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    
    # Informations professionnelles (optionnelles à l'inscription)
    profession: Optional[str] = None
    monthly_income: Optional[float] = Field(None, ge=0)
    
    # Localisation
    city: Optional[str] = None
    address: Optional[str] = None
    
    # Mot de passe (optionnel pour inscription par SMS)
    password: Optional[str] = Field(None, min_length=8)
    
    # Préférences
    preferences: Optional[Dict[str, Any]] = {}
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and not v.startswith('+241'):
            if v.startswith('241'):
                v = '+' + v
            elif v.startswith('0'):
                v = '+241' + v[1:]
            else:
                v = '+241' + v
        return v
    
    @validator('password')
    def validate_password_strength(cls, v, values):
        registration_method = values.get('registration_method')
        
        # Mot de passe requis pour inscription par email
        if registration_method == RegistrationMethod.EMAIL and not v:
            raise ValueError('Le mot de passe est requis pour l\'inscription par email')
        
        if v and len(v) < 8:
            raise ValueError('Le mot de passe doit contenir au moins 8 caractères')
        
        return v
    
    @validator('email')
    def email_required_for_email_registration(cls, v, values):
        if values.get('registration_method') == RegistrationMethod.EMAIL and not v:
            raise ValueError('L\'email est requis pour l\'inscription par email')
        return v
    
    @validator('phone')
    def phone_required_for_phone_registration(cls, v, values):
        if values.get('registration_method') == RegistrationMethod.PHONE and not v:
            raise ValueError('Le téléphone est requis pour l\'inscription par SMS')
        return v

class UserLoginRequest(BaseModel):
    # L'utilisateur peut se connecter avec email ou téléphone
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str = Field(..., min_length=1)
    remember_me: bool = False
    device_info: Optional[Dict[str, Any]] = {}
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and not v.startswith('+241'):
            if v.startswith('241'):
                v = '+' + v
            elif v.startswith('0'):
                v = '+241' + v[1:]
            else:
                v = '+241' + v
        return v
    
    def __init__(self, **data):
        super().__init__(**data)
        if not self.email and not self.phone:
            raise ValueError('Email ou téléphone requis pour la connexion')

class VerificationRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    code: str = Field(..., min_length=4, max_length=10)

class ResendVerificationRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class PasswordResetConfirm(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    code: str = Field(..., min_length=4, max_length=10)
    new_password: str = Field(..., min_length=8)

# ==================== RÉPONSES ====================

class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    profession: Optional[str] = None
    monthly_income: Optional[float] = None
    city: Optional[str] = None
    address: Optional[str] = None
    registration_method: str
    email_verified: bool
    phone_verified: bool
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    preferences: Dict[str, Any] = {}

class LoginResponse(BaseModel):
    success: bool
    user: UserResponse
    token: str
    refresh_token: Optional[str] = None
    expires_in: int
    message: Optional[str] = None

class RegistrationResponse(BaseModel):
    success: bool
    user: UserResponse
    verification_required: bool
    verification_method: Optional[str] = None
    message: str

# ==================== PROFIL UTILISATEUR ====================

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    profession: Optional[str] = None
    monthly_income: Optional[float] = Field(None, ge=0)
    city: Optional[str] = None
    address: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class AddContactMethodRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str  # Confirmation avec mot de passe

# ==================== SIMULATIONS ET APPLICATIONS ====================

class SaveSimulationRequest(BaseModel):
    simulation_id: str
    simulation_type: Literal["credit", "savings", "insurance"]
    name: str = Field(..., min_length=1, max_length=200)

class CreditApplicationRequest(BaseModel):
    credit_product_id: str
    simulation_id: Optional[str] = None
    requested_amount: float = Field(..., gt=0)
    duration_months: int = Field(..., gt=0)
    purpose: str = Field(..., min_length=10)
    
    # Informations financières
    monthly_income: float = Field(..., gt=0)
    current_debts: float = Field(0, ge=0)
    down_payment: float = Field(0, ge=0)
    
    # Informations emploi
    employment_type: Optional[str] = None
    employer_name: Optional[str] = None
    employment_duration_months: Optional[int] = Field(None, ge=0)
    
    # Documents (IDs des fichiers uploadés)
    document_ids: List[str] = []


class SavingsApplicationRequest(BaseModel):
    savings_product_id: str 
    simulation_id: Optional[str] = None
    initial_deposit: float = Field(..., gt=0)
    monthly_contribution: Optional[float] = Field(None, ge=0)
    savings_goal: Optional[str] = None
    target_amount: Optional[float] = Field(None, gt=0)
    target_date: Optional[date]= None
    document_ids: List[str] = []

class InsuranceApplicationRequest(BaseModel):
    insurance_product_id: str
    quote_id: Optional[str] = None
    insurance_type: str
    coverage_amount: Optional[float] = Field(None, gt=0)
    
    # Bénéficiaires
    beneficiaries: List[Dict[str, Any]] = []
    
    # Informations spécifiques selon le type
    vehicle_info: Optional[Dict[str, Any]] = None
    property_info: Optional[Dict[str, Any]] = None
    health_info: Optional[Dict[str, Any]] = None
    travel_info: Optional[Dict[str, Any]] = None
    business_info: Optional[Dict[str, Any]] = None
    
    document_ids: List[str] = []

# ==================== NOTIFICATIONS ====================

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    is_read: bool
    priority: str
    created_at: datetime

class MarkNotificationReadRequest(BaseModel):
    notification_ids: List[str]

# ==================== DASHBOARD UTILISATEUR ====================

class UserStatsResponse(BaseModel):
    total_credit_simulations: int
    total_savings_simulations: int
    total_insurance_quotes: int
    total_credit_applications: int
    total_savings_applications: int
    total_insurance_applications: int
    unread_notifications: int

class ApplicationSummary(BaseModel):
    id: str
    type: Literal["credit", "savings", "insurance"]
    product_name: str
    bank_or_company_name: str
    amount: Optional[float] = None
    status: str
    submitted_at: datetime
    updated_at: datetime

class SimulationSummary(BaseModel):
    id: str
    type: Literal["credit", "savings", "insurance"]
    product_name: str
    bank_or_company_name: str
    name: Optional[str] = None
    saved: bool
    created_at: datetime
    # Résultats principaux selon le type
    result_summary: Dict[str, Any]

class UserDashboardResponse(BaseModel):
    user: UserResponse
    stats: UserStatsResponse
    recent_simulations: List[SimulationSummary]
    recent_applications: List[ApplicationSummary]
    notifications: List[NotificationResponse]

# ==================== DOCUMENTS ====================

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    file_type: str
    file_size: int
    upload_url: Optional[str] = None  # URL pour upload direct si utilisé
    message: str

class DocumentInfo(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    uploaded_at: datetime
    application_type: Optional[str] = None
    application_id: Optional[str] = None