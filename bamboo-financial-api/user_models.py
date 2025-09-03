# user_models.py - Modèles SQLAlchemy pour les utilisateurs

from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer, Numeric, Date, ForeignKey, JSON, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime
import uuid

# Importer la base existante si elle existe, sinon créer une nouvelle
try:
    from models import Base
except ImportError:
    from sqlalchemy.ext.declarative import declarative_base
    Base = declarative_base()

# ==================== MODÈLES UTILISATEUR ====================

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(50), primary_key=True, default=lambda: f"user_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:6]}")
    
    # Informations de contact
    email = Column(String(100), unique=True, nullable=True)
    phone = Column(String(20), unique=True, nullable=True)
    
    # Informations personnelles
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(10), nullable=True)
    
    # Informations professionnelles
    profession = Column(String(100), nullable=True)
    monthly_income = Column(Numeric(12, 2), nullable=True)
    
    # Localisation
    city = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    
    # Authentification
    password_hash = Column(String(255), nullable=True)
    registration_method = Column(String(20), nullable=False)
    
    # Vérification
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    verification_code = Column(String(10), nullable=True)
    verification_expires_at = Column(DateTime, nullable=True)
    
    # Statut et préférences
    is_active = Column(Boolean, default=True)
    preferences = Column(JSON, default=dict)
    
    # Métadonnées
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("UserNotification", back_populates="user", cascade="all, delete-orphan")
    credit_applications = relationship("UserCreditApplication", back_populates="user", cascade="all, delete-orphan")
    savings_applications = relationship("UserSavingsApplication", back_populates="user", cascade="all, delete-orphan")
    insurance_applications = relationship("UserInsuranceApplication", back_populates="user", cascade="all, delete-orphan")
    
    # Contraintes
    __table_args__ = (
        CheckConstraint(
            "(email IS NOT NULL AND email != '') OR (phone IS NOT NULL AND phone != '')",
            name="check_contact_method"
        ),
        CheckConstraint(
            "registration_method IN ('email', 'phone')",
            name="check_registration_method"
        )
    )

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(String(50), primary_key=True, default=lambda: f"session_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:6]}")
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    
    # Informations de session
    token = Column(String(500), unique=True, nullable=False)
    device_info = Column(JSON, default=dict)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Validité
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relations
    user = relationship("User", back_populates="sessions")

class UserNotification(Base):
    __tablename__ = "user_notifications"
    
    id = Column(String(50), primary_key=True, default=lambda: f"notif_{int(datetime.utcnow().timestamp())}_{uuid.uuid4().hex[:6]}")
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    
    # Contenu
    type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Liaison avec d'autres entités
    related_entity_type = Column(String(50), nullable=True)
    related_entity_id = Column(String(50), nullable=True)
    
    # Statut
    is_read = Column(Boolean, default=False)
    priority = Column(String(20), default="normal")
    created_at = Column(DateTime, default=func.now())
    
    # Relations
    user = relationship("User", back_populates="notifications")
    
    # Contraintes
    __table_args__ = (
        CheckConstraint(
            "priority IN ('low', 'normal', 'high', 'urgent')",
            name="check_notification_priority"
        ),
    )

# ==================== MODÈLES APPLICATIONS ====================

class UserCreditApplication(Base):
    __tablename__ = "user_credit_applications"
    
    id = Column(String(50), primary_key=True, default=lambda: f"app_credit_{int(datetime.utcnow().timestamp())}")
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    credit_product_id = Column(String(50), ForeignKey("credit_products.id"), nullable=True)
    simulation_id = Column(String(50), ForeignKey("credit_simulations.id"), nullable=True)
    
    # Détails de la demande
    requested_amount = Column(Numeric(12, 2), nullable=False)
    duration_months = Column(Integer, nullable=False)
    purpose = Column(Text, nullable=False)
    
    # Informations financières
    monthly_income = Column(Numeric(10, 2), nullable=False)
    current_debts = Column(Numeric(10, 2), default=0)
    down_payment = Column(Numeric(12, 2), default=0)
    
    # Informations emploi
    employment_type = Column(String(50), nullable=True)
    employer_name = Column(String(200), nullable=True)
    employment_duration_months = Column(Integer, nullable=True)
    
    # Documents et traitement
    documents = Column(JSON, default=list)
    status = Column(String(50), default="pending")
    bank_response = Column(JSON, nullable=True)
    bank_contact_info = Column(JSON, nullable=True)
    
    # Suivi administratif
    processing_notes = Column(Text, nullable=True)
    priority_level = Column(Integer, default=3)
    assigned_to = Column(String(50), nullable=True)
    expected_response_date = Column(Date, nullable=True)
    
    # Notifications
    user_notified = Column(Boolean, default=False)
    last_notification_sent = Column(DateTime, nullable=True)
    
    # Métadonnées
    submitted_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    user = relationship("User", back_populates="credit_applications")
    
    # Contraintes
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'under_review', 'approved', 'rejected', 'on_hold', 'completed')",
            name="check_credit_application_status"
        ),
        CheckConstraint(
            "priority_level BETWEEN 1 AND 5",
            name="check_priority_level"
        )
    )

class UserSavingsApplication(Base):
    __tablename__ = "user_savings_applications"
    
    id = Column(String(50), primary_key=True, default=lambda: f"app_savings_{int(datetime.utcnow().timestamp())}")
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    savings_product_id = Column(String(50), ForeignKey("savings_products.id"), nullable=True)
    simulation_id = Column(String(50), ForeignKey("savings_simulations.id"), nullable=True)
    
    # Détails de la demande
    initial_deposit = Column(Numeric(12, 2), nullable=False)
    monthly_contribution = Column(Numeric(10, 2), nullable=True)
    savings_goal = Column(Text, nullable=True)
    target_amount = Column(Numeric(12, 2), nullable=True)
    target_date = Column(Date, nullable=True)
    
    # Documents et traitement
    documents = Column(JSON, default=list)
    status = Column(String(50), default="pending")
    bank_response = Column(JSON, nullable=True)
    account_number = Column(String(50), nullable=True)
    
    # Suivi administratif
    processing_notes = Column(Text, nullable=True)
    assigned_to = Column(String(50), nullable=True)
    
    # Métadonnées
    submitted_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    user = relationship("User", back_populates="savings_applications")
    
    # Contraintes
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'under_review', 'approved', 'rejected', 'opened', 'active')",
            name="check_savings_application_status"
        ),
    )

class UserInsuranceApplication(Base):
    __tablename__ = "user_insurance_applications"
    
    id = Column(String(50), primary_key=True, default=lambda: f"app_insurance_{int(datetime.utcnow().timestamp())}")
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    insurance_product_id = Column(String(50), ForeignKey("insurance_products.id"), nullable=True)
    quote_id = Column(String(50), ForeignKey("insurance_quotes.id"), nullable=True)
    
    # Informations de base
    insurance_type = Column(String(50), nullable=False)
    coverage_amount = Column(Numeric(12, 2), nullable=True)
    beneficiaries = Column(JSON, default=list)
    
    # Informations spécifiques par type d'assurance
    vehicle_info = Column(JSON, nullable=True)  # Pour assurance auto
    property_info = Column(JSON, nullable=True)  # Pour assurance habitation
    health_info = Column(JSON, nullable=True)  # Pour assurance santé/vie
    travel_info = Column(JSON, nullable=True)  # Pour assurance voyage
    business_info = Column(JSON, nullable=True)  # Pour assurance professionnelle
    
    # Documents et examens
    documents = Column(JSON, default=list)
    medical_exam_required = Column(Boolean, default=False)
    medical_exam_completed = Column(Boolean, default=False)
    
    # Traitement
    status = Column(String(50), default="pending")
    insurance_response = Column(JSON, nullable=True)
    policy_number = Column(String(50), nullable=True)
    premium_amount = Column(Numeric(10, 2), nullable=True)
    
    # Suivi administratif
    processing_notes = Column(Text, nullable=True)
    assigned_to = Column(String(50), nullable=True)
    
    # Métadonnées
    submitted_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    user = relationship("User", back_populates="insurance_applications")
    
    # Contraintes
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'under_review', 'medical_exam_required', 'approved', 'rejected', 'active')",
            name="check_insurance_application_status"
        ),
    )

# ==================== VUES POUR STATISTIQUES ====================

# Cette vue sera créée par la migration SQL, pas par SQLAlchemy
# Elle est référencée ici pour documentation
class UserDashboardStats(Base):
    __tablename__ = "user_dashboard_stats"
    
    id = Column(String(50), primary_key=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(100))
    phone = Column(String(20))
    
    total_credit_simulations = Column(Integer)
    total_savings_simulations = Column(Integer)
    total_insurance_quotes = Column(Integer)
    total_credit_applications = Column(Integer)
    total_savings_applications = Column(Integer)
    total_insurance_applications = Column(Integer)
    unread_notifications = Column(Integer)

# ==================== EXTENSIONS AUX MODÈLES EXISTANTS ====================

# Si vous avez déjà des modèles existants, ajoutez ces colonnes :

# Pour CreditSimulation (ajout des colonnes user_id, saved, name)
# ALTER TABLE credit_simulations ADD COLUMN user_id VARCHAR(50) REFERENCES users(id);
# ALTER TABLE credit_simulations ADD COLUMN saved BOOLEAN DEFAULT FALSE;
# ALTER TABLE credit_simulations ADD COLUMN name VARCHAR(200);

# Pour SavingsSimulation (ajout des colonnes user_id, saved, name)
# ALTER TABLE savings_simulations ADD COLUMN user_id VARCHAR(50) REFERENCES users(id);
# ALTER TABLE savings_simulations ADD COLUMN saved BOOLEAN DEFAULT FALSE;
# ALTER TABLE savings_simulations ADD COLUMN name VARCHAR(200);

# Pour InsuranceQuote (ajout des colonnes user_id, saved, name)
# ALTER TABLE insurance_quotes ADD COLUMN user_id VARCHAR(50) REFERENCES users(id);
# ALTER TABLE insurance_quotes ADD COLUMN saved BOOLEAN DEFAULT FALSE;
# ALTER TABLE insurance_quotes ADD COLUMN name VARCHAR(200);

# ==================== MODÈLE OPTIONNEL POUR DOCUMENTS ====================

class UserDocument(Base):
    __tablename__ = "user_documents"
    
    id = Column(String(50), primary_key=True, default=lambda: f"doc_{uuid.uuid4().hex}")
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    
    # Informations du fichier
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=True)  # Chemin sur le serveur ou S3
    file_url = Column(String(500), nullable=True)  # URL d'accès
    
    # Classification
    document_type = Column(String(50), nullable=True)  # 'id_card', 'payslip', 'bank_statement', etc.
    application_type = Column(String(50), nullable=True)  # 'credit', 'savings', 'insurance'
    application_id = Column(String(50), nullable=True)
    
    # Métadonnées
    is_verified = Column(Boolean, default=False)
    verified_by = Column(String(50), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    uploaded_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime, nullable=True)  # Pour documents temporaires
    
    # Relations
    user = relationship("User")

# ==================== FONCTIONS HELPER POUR LES MODÈLES ====================

def create_user_tables():
    """
    Fonction pour créer toutes les tables utilisateur
    À utiliser avec votre engine SQLAlchemy existant
    """
    from sqlalchemy import create_engine
    import os
    
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/bamboo_db")
    engine = create_engine(DATABASE_URL)
    
    # Créer toutes les tables
    Base.metadata.create_all(engine)
    
    print("Tables utilisateur créées avec succès !")

def add_user_columns_to_existing_tables():
    """
    Script SQL pour ajouter les colonnes user aux tables existantes
    """
    sql_commands = [
        # Ajouter colonnes à credit_simulations
        "ALTER TABLE credit_simulations ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) REFERENCES users(id);",
        "ALTER TABLE credit_simulations ADD COLUMN IF NOT EXISTS saved BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE credit_simulations ADD COLUMN IF NOT EXISTS name VARCHAR(200);",
        
        # Ajouter colonnes à savings_simulations
        "ALTER TABLE savings_simulations ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) REFERENCES users(id);",
        "ALTER TABLE savings_simulations ADD COLUMN IF NOT EXISTS saved BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE savings_simulations ADD COLUMN IF NOT EXISTS name VARCHAR(200);",
        
        # Ajouter colonnes à insurance_quotes
        "ALTER TABLE insurance_quotes ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) REFERENCES users(id);",
        "ALTER TABLE insurance_quotes ADD COLUMN IF NOT EXISTS saved BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE insurance_quotes ADD COLUMN IF NOT EXISTS name VARCHAR(200);",
        
        # Index pour les performances
        "CREATE INDEX IF NOT EXISTS idx_credit_simulations_user ON credit_simulations(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_savings_simulations_user ON savings_simulations(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_insurance_quotes_user ON insurance_quotes(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_credit_simulations_saved ON credit_simulations(saved);",
        "CREATE INDEX IF NOT EXISTS idx_savings_simulations_saved ON savings_simulations(saved);",
        "CREATE INDEX IF NOT EXISTS idx_insurance_quotes_saved ON insurance_quotes(saved);",
    ]
    
    return sql_commands

# ==================== MODÈLES ÉTENDUS (si vous voulez étendre les existants) ====================

# Si vous voulez modifier vos modèles existants au lieu d'utiliser des migrations SQL,
# voici comment les étendre :

# class CreditSimulationExtended(Base):
#     __tablename__ = "credit_simulations"
#     
#     # Colonnes existantes...
#     id = Column(String(50), primary_key=True)
#     # ... autres colonnes existantes ...
#     
#     # Nouvelles colonnes
#     user_id = Column(String(50), ForeignKey("users.id"), nullable=True)
#     saved = Column(Boolean, default=False)
#     name = Column(String(200), nullable=True)
#     
#     # Relations
#     user = relationship("User")

# class SavingsSimulationExtended(Base):
#     __tablename__ = "savings_simulations"
#     
#     # Colonnes existantes...
#     id = Column(String(50), primary_key=True)
#     # ... autres colonnes existantes ...
#     
#     # Nouvelles colonnes
#     user_id = Column(String(50), ForeignKey("users.id"), nullable=True)
#     saved = Column(Boolean, default=False)
#     name = Column(String(200), nullable=True)
#     
#     # Relations
#     user = relationship("User")

# class InsuranceQuoteExtended(Base):
#     __tablename__ = "insurance_quotes"
#     
#     # Colonnes existantes...
#     id = Column(String(50), primary_key=True)
#     # ... autres colonnes existantes ...
#     
#     # Nouvelles colonnes
#     user_id = Column(String(50), ForeignKey("users.id"), nullable=True)
#     saved = Column(Boolean, default=False)
#     name = Column(String(200), nullable=True)
#     
#     # Relations
#     user = relationship("User")

if __name__ == "__main__":
    # Pour tester la création des tables
    create_user_tables()