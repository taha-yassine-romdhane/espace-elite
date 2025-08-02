-- Migration script to update enum values from French to English

-- Update MedicalDevice status values
UPDATE "MedicalDevice" SET status = 'ACTIVE' WHERE status = 'ACTIVE';
UPDATE "MedicalDevice" SET status = 'MAINTENANCE' WHERE status = 'MAINTENANCE';
UPDATE "MedicalDevice" SET status = 'RETIRED' WHERE status = 'RETIRED';
UPDATE "MedicalDevice" SET status = 'RESERVED' WHERE status = 'RESERVED';
UPDATE "MedicalDevice" SET status = 'FOR_RENT' WHERE status = 'FOR_RENT';
UPDATE "MedicalDevice" SET status = 'FOR_SALE' WHERE status = 'FOR_SALE';
UPDATE "MedicalDevice" SET status = 'SOLD' WHERE status = 'SOLD';

-- Update Product status values  
UPDATE "Product" SET status = 'ACTIVE' WHERE status = 'EN_VENTE';
UPDATE "Product" SET status = 'RETIRED' WHERE status = 'HORS_SERVICE';
UPDATE "Product" SET status = 'SOLD' WHERE status = 'VENDU';

-- Update Stock status values
UPDATE "Stock" SET status = 'FOR_SALE' WHERE status = 'EN_VENTE';
UPDATE "Stock" SET status = 'FOR_RENT' WHERE status = 'EN_LOCATION';
UPDATE "Stock" SET status = 'IN_REPAIR' WHERE status = 'EN_REPARATION';
UPDATE "Stock" SET status = 'OUT_OF_SERVICE' WHERE status = 'HORS_SERVICE';

-- Show what we'll be updating
SELECT 'MedicalDevice status counts:' as info;
SELECT status, COUNT(*) FROM "MedicalDevice" GROUP BY status;

SELECT 'Product status counts:' as info;
SELECT status, COUNT(*) FROM "Product" GROUP BY status;

SELECT 'Stock status counts:' as info;
SELECT status, COUNT(*) FROM "Stock" GROUP BY status;