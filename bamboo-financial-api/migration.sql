-- Ajouter les colonnes manquantes
ALTER TABLE insurance_companies 
ADD COLUMN logo_data TEXT,
ADD COLUMN logo_content_type VARCHAR(100);

-- Si d'autres colonnes manquent, ajoutez-les aussi
-- Regardez votre modèle InsuranceCompany pour voir toutes les colonnes définies