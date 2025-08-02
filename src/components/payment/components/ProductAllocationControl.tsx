import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  type: string;
  sellingPrice: number;
  quantity?: number;
}

interface ProductAllocationControlProps {
  selectedProducts: Product[];
  totalPaymentAmount: number;
  productAllocations: Record<string, number>;
  onAllocationChange: (allocations: Record<string, number>) => void;
  className?: string;
}

export const ProductAllocationControl: React.FC<ProductAllocationControlProps> = ({
  selectedProducts,
  totalPaymentAmount,
  productAllocations,
  onAllocationChange,
  className = ""
}) => {
  // Calculate total allocated and remaining
  const totalAllocated = Object.values(productAllocations).reduce((sum, amount) => sum + (amount || 0), 0);
  const remainingToAllocate = totalPaymentAmount - totalAllocated;
  const isFullyAllocated = Math.abs(remainingToAllocate) < 0.01;

  const handleProductAllocationChange = (productId: string, amount: number) => {
    const newAllocations = {
      ...productAllocations,
      [productId]: amount
    };
    onAllocationChange(newAllocations);
  };

  const distributeEqually = () => {
    if (selectedProducts.length === 0) return;
    const equalAmount = totalPaymentAmount / selectedProducts.length;
    const newAllocations: Record<string, number> = {};
    selectedProducts.forEach(product => {
      newAllocations[product.id] = equalAmount;
    });
    onAllocationChange(newAllocations);
  };

  const distributeProportionally = () => {
    if (selectedProducts.length === 0) return;
    const totalValue = selectedProducts.reduce((sum, product) => 
      sum + (Number(product.sellingPrice || 0) * (product.quantity || 1)), 0
    );
    if (totalValue === 0) return;

    const newAllocations: Record<string, number> = {};
    selectedProducts.forEach(product => {
      const productValue = Number(product.sellingPrice || 0) * (product.quantity || 1);
      newAllocations[product.id] = (productValue / totalValue) * totalPaymentAmount;
    });
    onAllocationChange(newAllocations);
  };

  const distributeByRemaining = () => {
    // Distribute based on remaining amount needed for each product
    if (selectedProducts.length === 0) return;
    
    // For now, we'll distribute proportionally - this can be enhanced later
    // to consider already paid amounts per product
    distributeProportionally();
  };

  const clearAllocations = () => {
    onAllocationChange({});
  };

  if (selectedProducts.length === 0 || totalPaymentAmount <= 0) {
    return null;
  }

  return (
    <div className={`border rounded-lg p-4 bg-gray-50 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <Label className="text-base font-medium">
          Répartition du paiement sur les produits
        </Label>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={distributeEqually}
          >
            Égal
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={distributeProportionally}
          >
            Proportionnel
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={distributeByRemaining}
          >
            Par Besoin
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={clearAllocations}
          >
            Effacer
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {selectedProducts.map(product => {
          const productPrice = Number(product.sellingPrice || 0) * (product.quantity || 1);
          const allocatedAmount = productAllocations[product.id] || 0;
          
          return (
            <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded border">
              <div className="flex-1">
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-gray-500">
                  Prix: {productPrice.toFixed(2)} DT
                  {product.quantity && product.quantity > 1 && ` (${product.quantity} × ${Number(product.sellingPrice || 0).toFixed(2)} DT)`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalPaymentAmount}
                  value={allocatedAmount}
                  onChange={(e) => handleProductAllocationChange(product.id, parseFloat(e.target.value) || 0)}
                  className="w-24 text-right"
                  placeholder="0.00"
                />
                <span className="text-sm text-gray-500">DT</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Allocation Summary */}
      <div className="mt-4 p-3 bg-white rounded border">
        <div className="flex justify-between items-center text-sm">
          <span>Total du paiement:</span>
          <span className="font-medium">{totalPaymentAmount.toFixed(2)} DT</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span>Total alloué:</span>
          <span className="font-medium">{totalAllocated.toFixed(2)} DT</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span>Reste à allouer:</span>
          <span className={`font-medium ${Math.abs(remainingToAllocate) < 0.01 ? 'text-green-600' : 'text-amber-600'}`}>
            {remainingToAllocate.toFixed(2)} DT
          </span>
        </div>
      </div>

      {!isFullyAllocated && (
        <Alert className="mt-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Veuillez allouer le montant complet du paiement avant de continuer.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProductAllocationControl;