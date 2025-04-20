import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product, ProductType } from "../types";
import { History, Sliders } from "lucide-react";
import { EnhancedTable } from "@/components/ui/enhanced-table";

interface EnhancedDiagnosticDevicesTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onViewHistory: (product: Product) => void;
  onViewParameters?: (product: Product) => void;
  renderActionButtons: (product: Product) => React.ReactNode;
}

export function EnhancedDiagnosticDevicesTable({ 
  products, 
  onEdit, 
  onDelete,
  onViewHistory,
  onViewParameters,
  renderActionButtons 
}: EnhancedDiagnosticDevicesTableProps) {
  // Filter to only show diagnostic devices
  const diagnosticDevices = products.filter(p => p.type === ProductType.DIAGNOSTIC_DEVICE);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'MAINTENANCE':
        return 'secondary';
      case 'RETIRED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getLocationName = (device: Product) => {
    if (!device.stockLocation) return "Non assigné";
    return typeof device.stockLocation === 'string' 
      ? device.stockLocation 
      : device.stockLocation.name || "Non assigné";
  };

  // Define columns for the enhanced table
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
          {product.status}
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
            onClick={() => onViewHistory(product)}
            title="Voir l'historique des réparations"
            className="h-6 w-6"
          >
            <History className="h-3 w-3" />
          </Button>
          {onViewParameters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewParameters(product)}
              title="Voir les paramètres"
              className="h-6 w-6"
            >
              <Sliders className="h-3 w-3" />
            </Button>
          )}
          {renderActionButtons(product)}
        </div>
      ),
      sortable: false
    }
  ];

  return (
    <EnhancedTable
      data={diagnosticDevices}
      columns={columns}
      searchField="name"
      searchPlaceholder="Rechercher un appareil de diagnostic..."
    />
  );
}
