export type ProductType = "MEDICAL_DEVICE" | "DIAGNOSTIC_DEVICE" | "ACCESSORY" | "SPARE_PART";
export type StockStatus = "EN_VENTE" | "EN_LOCATION" | "EN_REPARATION" | "VENDU" | "ACTIVE";

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  technicalSpecs?: string;
  warranty?: string;
  availableForRent?: boolean;
  requiresMaintenance?: boolean;
  stockLocation: string;
  stockLocationId?: string;
  stockQuantity: number;
  status: StockStatus;
  configuration?: string;
  installationDate?: string;
  minStock?: number;
  maxStock?: number;
  alertThreshold?: number;
}
