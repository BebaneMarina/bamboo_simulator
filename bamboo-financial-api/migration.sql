-- Migration pour ajouter les colonnes d'image à la table banks
ALTER TABLE banks ADD COLUMN IF NOT EXISTS logo_data BYTEA;
ALTER TABLE banks ADD COLUMN IF NOT EXISTS logo_content_type VARCHAR(100);
ALTER TABLE banks ADD COLUMN IF NOT EXISTS logo_filename VARCHAR(255);
ALTER TABLE banks ADD COLUMN IF NOT EXISTS logo_file_size INTEGER;

-- Index pour optimiser les requêtes d'images
CREATE INDEX IF NOT EXISTS idx_banks_logo ON banks(id) WHERE logo_data IS NOT NULL;