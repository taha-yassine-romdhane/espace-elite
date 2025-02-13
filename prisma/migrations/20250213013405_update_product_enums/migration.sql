/*
  Warnings:

  - The `status` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `stock` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('FONCTIONNEL', 'REPARATION', 'NON_FONCTIONNEL');

-- CreateEnum
CREATE TYPE "StockLocation" AS ENUM ('VENTE', 'LOCATION', 'HORS_SERVICE');

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "stock",
ADD COLUMN     "stock" "StockLocation" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'FONCTIONNEL';
