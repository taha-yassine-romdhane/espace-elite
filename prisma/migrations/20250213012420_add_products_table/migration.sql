-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "stock" TEXT NOT NULL,
    "ns" TEXT,
    "prixAchat" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Reparation',
    "montantReparation" DOUBLE PRECISION,
    "pieceRechange" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
