import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Sliders, 
  X, 
  CircleAlert, 
  CheckCircle2 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: any;
  index: number;
  onRemove: (index: number) => void;
  onConfigure: (index: number) => void;
}

export function ProductCard({ product, index, onRemove, onConfigure }: ProductCardProps) {
  // Helper function to determine if parameters are configured
  const isParametersConfigured = (product: any) => {
    if (!product.parameters || product.parameters.length === 0) {
      return false;
    }
    
    // Check if all required parameters have values
    return product.parameters.every((param: any) => {
      if (param.required) {
        if (param.parameterType === 'NUMERIC' || param.parameterType === 'TEXT') {
          return param.value !== undefined && param.value !== null && param.value !== '';
        } else if (param.parameterType === 'BOOLEAN') {
          return param.value === true || param.value === false;
        } else if (param.parameterType === 'SELECT') {
          return param.selectedOption !== undefined && param.selectedOption !== null;
        } else if (param.parameterType === 'RESULT') {
          // Result parameters are configured if they have a resultDueDate
          return param.resultDueDate !== undefined && param.resultDueDate !== null;
        }
      }
      return true;
    });
  };

  // Determine parameter status
  const renderParameterStatus = () => {
    if (!product.parameters) {
      return (
        <div className="flex items-center text-yellow-600 text-sm mt-1">
          <CircleAlert className="h-4 w-4 mr-1" />
          <span>Paramètres non configurés</span>
        </div>
      );
    }

    const configured = isParametersConfigured(product);
    
    if (configured) {
      return (
        <div className="flex items-center text-green-600 text-sm mt-1">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          <span>Paramètres configurés</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-yellow-600 text-sm mt-1">
          <CircleAlert className="h-4 w-4 mr-1" />
          <span>Paramètres incomplets</span>
        </div>
      );
    }
  };

  return (
    <Card className={cn(
      "p-4 border border-gray-200 transition-colors",
      isParametersConfigured(product) ? "bg-green-50" : "bg-yellow-50"
    )}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-blue-900 mr-2" />
            <h3 className="font-medium text-gray-900">{product.name}</h3>
          </div>
          
          <div className="text-sm text-gray-500 ml-7">
            {product.brand} {product.model}
            {product.serialNumber && ` • N°${product.serialNumber}`}
          </div>
          
          {renderParameterStatus()}
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => onConfigure(index)}
          >
            <Sliders className="h-4 w-4 mr-1" />
            <span>Configurer</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => onRemove(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
