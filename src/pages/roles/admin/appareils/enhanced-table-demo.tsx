import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EnhancedTable } from "@/components/ui/enhanced-table";
import { Product, ProductType } from "./types";
import { Badge } from "@/components/ui/badge";

export default function EnhancedTableDemo() {
  // Fetch devices
  const { data: products, isLoading } = useQuery({
    queryKey: ["medical-devices"],
    queryFn: async () => {
      const response = await fetch("/api/medical-devices");
      if (!response.ok) {
        throw new Error("Failed to fetch devices");
      }
      return response.json();
    },
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'EN_VENTE':
      case 'ACTIVE':
        return 'default';
      case 'EN_REPARATION':
      case 'MAINTENANCE':
        return 'secondary';
      case 'VENDU':
      case 'RETIRED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EN_VENTE':
      case 'ACTIVE':
        return 'EN VENTE';
      case 'EN_REPARATION':
      case 'MAINTENANCE':
        return 'EN RÉPARATION';
      case 'VENDU':
      case 'RETIRED':
        return 'VENDU';
      case 'EN_LOCATION':
        return 'EN LOCATION';
      default:
        return status;
    }
  };

  const getLocationName = (device: Product) => {
    if (!device.stockLocation) return "Non assigné";
    return typeof device.stockLocation === 'string'
      ? device.stockLocation
      : device.stockLocation.name || "Non assigné";
  };

  const columns = [
    {
      key: 'name' as keyof Product,
      header: 'Nom',
      sortable: true
    },
    {
      key: 'brand' as keyof Product,
      header: 'Marque',
      sortable: true
    },
    {
      key: 'model' as keyof Product,
      header: 'Modèle',
      sortable: true
    },
    {
      key: 'serialNumber' as keyof Product,
      header: 'N° Série',
      sortable: true
    },
    {
      key: 'stockLocation' as keyof Product,
      header: 'Emplacement',
      render: (product: Product) => getLocationName(product),
      sortable: false
    },
    {
      key: 'status' as keyof Product,
      header: 'État',
      render: (product: Product) => (
        <Badge variant={getStatusBadgeVariant(product.status)}>
          {getStatusLabel(product.status)}
        </Badge>
      ),
      sortable: true
    },
    {
      key: 'purchasePrice' as keyof Product,
      header: "Prix d'achat",
      render: (product: Product) => product.purchasePrice ? `${product.purchasePrice} DT` : '-',
      sortable: true
    },
    {
      key: 'sellingPrice' as keyof Product,
      header: 'Prix de vente',
      render: (product: Product) => product.sellingPrice ? `${product.sellingPrice} DT` : '-',
      sortable: true
    },
    {
      key: 'actions' as keyof Product,
      header: 'Actions',
      render: (product: Product) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => console.log('View history', product.id)}
            title="Voir l'historique des réparations"
            className="h-8 w-8"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => console.log('Edit', product.id)}
            title="Modifier"
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => console.log('Delete', product.id)}
            title="Supprimer"
            className="h-8 w-8 text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      sortable: false
    }
  ];

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  // Filter accessories only
  const accessories = products?.filter((p: Product) => p.type === ProductType.ACCESSORY) || [];

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Accessoires (Table Améliorée)</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un accessoire
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Accessoires avec filtrage et tri</h2>
        <p className="mb-4 text-gray-600">
          Cliquez sur les en-têtes de colonnes pour trier. Utilisez la barre de recherche pour filtrer par nom.
        </p>
        
        <EnhancedTable
          data={accessories}
          columns={columns}
          searchField="name"
          searchPlaceholder="Rechercher un accessoire..."
        />
      </div>
    </div>
  );
}
