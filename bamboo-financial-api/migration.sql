-- Migration pour créer les tables utilisateurs et gestion des simulations/demandes

-- Table des utilisateurs
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || FLOOR(RANDOM() * 1000),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),
    profession VARCHAR(100),
    monthly_income DECIMAL(12,2),
    city VARCHAR(100),
    address TEXT,
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(10),
    verification_expires_at TIMESTAMP,
    registration_method VARCHAR(20) NOT NULL CHECK (registration_method IN ('email', 'phone')),
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Au moins un moyen de contact requis
    CONSTRAINT check_contact_method CHECK (
        (email IS NOT NULL AND email != '') OR 
        (phone IS NOT NULL AND phone != '')
    )
);

-- Table des sessions utilisateur
CREATE TABLE user_sessions (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'session_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || FLOOR(RANDOM() * 1000),
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modifier la table credit_simulations pour ajouter user_id
ALTER TABLE credit_simulations ADD COLUMN user_id VARCHAR(50) REFERENCES users(id);
ALTER TABLE credit_simulations ADD COLUMN saved BOOLEAN DEFAULT FALSE;
ALTER TABLE credit_simulations ADD COLUMN name VARCHAR(200);

-- Modifier la table savings_simulations pour ajouter user_id
ALTER TABLE savings_simulations ADD COLUMN user_id VARCHAR(50) REFERENCES users(id);
ALTER TABLE savings_simulations ADD COLUMN saved BOOLEAN DEFAULT FALSE;
ALTER TABLE savings_simulations ADD COLUMN name VARCHAR(200);

-- Modifier la table insurance_quotes pour ajouter user_id
ALTER TABLE insurance_quotes ADD COLUMN user_id VARCHAR(50) REFERENCES users(id);
ALTER TABLE insurance_quotes ADD COLUMN saved BOOLEAN DEFAULT FALSE;
ALTER TABLE insurance_quotes ADD COLUMN name VARCHAR(200);

-- Table des demandes de crédit
CREATE TABLE user_credit_applications (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'app_credit_' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    credit_product_id VARCHAR(50) REFERENCES credit_products(id),
    simulation_id VARCHAR(50) REFERENCES credit_simulations(id),
    requested_amount DECIMAL(12,2) NOT NULL,
    duration_months INTEGER NOT NULL,
    purpose TEXT NOT NULL,
    monthly_income DECIMAL(10,2) NOT NULL,
    current_debts DECIMAL(10,2) DEFAULT 0,
    down_payment DECIMAL(12,2) DEFAULT 0,
    employment_type VARCHAR(50),
    employer_name VARCHAR(200),
    employment_duration_months INTEGER,
    
    -- Documents fournis
    documents JSONB DEFAULT '[]',
    
    -- Statut de la demande
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'under_review', 'approved', 'rejected', 'on_hold', 'completed')
    ),
    
    -- Réponse de la banque
    bank_response JSONB,
    bank_contact_info JSONB,
    
    -- Suivi
    processing_notes TEXT,
    priority_level INTEGER DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 5),
    assigned_to VARCHAR(50),
    expected_response_date DATE,
    
    -- Notifications
    user_notified BOOLEAN DEFAULT FALSE,
    last_notification_sent TIMESTAMP,
    
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des demandes d'épargne
CREATE TABLE user_savings_applications (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'app_savings_' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    savings_product_id VARCHAR(50) REFERENCES savings_products(id),
    simulation_id VARCHAR(50) REFERENCES savings_simulations(id),
    initial_deposit DECIMAL(12,2) NOT NULL,
    monthly_contribution DECIMAL(10,2),
    savings_goal TEXT,
    target_amount DECIMAL(12,2),
    target_date DATE,
    
    -- Documents fournis
    documents JSONB DEFAULT '[]',
    
    -- Statut de la demande
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'under_review', 'approved', 'rejected', 'opened', 'active')
    ),
    
    -- Réponse de la banque
    bank_response JSONB,
    account_number VARCHAR(50),
    
    -- Suivi
    processing_notes TEXT,
    assigned_to VARCHAR(50),
    
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des demandes d'assurance
CREATE TABLE user_insurance_applications (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'app_insurance_' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    insurance_product_id VARCHAR(50) REFERENCES insurance_products(id),
    quote_id VARCHAR(50) REFERENCES insurance_quotes(id),
    insurance_type VARCHAR(50) NOT NULL,
    coverage_amount DECIMAL(12,2),
    beneficiaries JSONB DEFAULT '[]',
    
    -- Informations spécifiques selon le type d'assurance
    vehicle_info JSONB, -- Pour assurance auto
    property_info JSONB, -- Pour assurance habitation
    health_info JSONB, -- Pour assurance santé/vie
    travel_info JSONB, -- Pour assurance voyage
    business_info JSONB, -- Pour assurance professionnelle
    
    -- Documents fournis
    documents JSONB DEFAULT '[]',
    medical_exam_required BOOLEAN DEFAULT FALSE,
    medical_exam_completed BOOLEAN DEFAULT FALSE,
    
    -- Statut de la demande
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'under_review', 'medical_exam_required', 'approved', 'rejected', 'active')
    ),
    
    -- Réponse de l'assureur
    insurance_response JSONB,
    policy_number VARCHAR(50),
    premium_amount DECIMAL(10,2),
    
    -- Suivi
    processing_notes TEXT,
    assigned_to VARCHAR(50),
    
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des notifications utilisateur
CREATE TABLE user_notifications (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'notif_' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50), -- 'credit_application', 'savings_application', etc.
    related_entity_id VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_credit_applications_user ON user_credit_applications(user_id);
CREATE INDEX idx_user_credit_applications_status ON user_credit_applications(status);
CREATE INDEX idx_user_savings_applications_user ON user_savings_applications(user_id);
CREATE INDEX idx_user_insurance_applications_user ON user_insurance_applications(user_id);
CREATE INDEX idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON user_notifications(is_read);

-- Triggers pour updated_at
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_user_credit_applications_modtime BEFORE UPDATE ON user_credit_applications FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_user_savings_applications_modtime BEFORE UPDATE ON user_savings_applications FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_user_insurance_applications_modtime BEFORE UPDATE ON user_insurance_applications FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Vue pour les statistiques utilisateur
CREATE VIEW user_dashboard_stats AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    COUNT(DISTINCT cs.id) as total_credit_simulations,
    COUNT(DISTINCT ss.id) as total_savings_simulations,
    COUNT(DISTINCT iq.id) as total_insurance_quotes,
    COUNT(DISTINCT uca.id) as total_credit_applications,
    COUNT(DISTINCT usa.id) as total_savings_applications,
    COUNT(DISTINCT uia.id) as total_insurance_applications,
    COUNT(DISTINCT un.id) FILTER (WHERE un.is_read = FALSE) as unread_notifications
FROM users u
LEFT JOIN credit_simulations cs ON u.id = cs.user_id
LEFT JOIN savings_simulations ss ON u.id = ss.user_id
LEFT JOIN insurance_quotes iq ON u.id = iq.user_id
LEFT JOIN user_credit_applications uca ON u.id = uca.user_id
LEFT JOIN user_savings_applications usa ON u.id = usa.user_id
LEFT JOIN user_insurance_applications uia ON u.id = uia.user_id
LEFT JOIN user_notifications un ON u.id = un.user_id
GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone;