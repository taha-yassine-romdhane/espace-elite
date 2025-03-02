import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TabSwitcher } from "./components/TabSwitcher";
import { MedicalDeviceForm } from "./components/forms/MedicalDeviceForm";
import { DiagnosticDeviceForm } from "./components/forms/DiagnosticDeviceForm";
import { AccessoryForm } from "./components/forms/AccessoryForm";
import { SparePartForm } from "./components/forms/SparePartForm";
import { MedicalDevicesTable } from "./components/MedicalDevicesTable";
import { DiagnosticDevicesTable } from "./components/DiagnosticDevicesTable";
import { AccessoriesTable } from "./components/AccessoriesTable";
import { SparePartsTable } from "./components/SparePartsTable";
import { StockLocationsTable } from "./components/StockLocationsTable";
import { LocationForm } from "./components/LocationForm";
import { Product, ProductType } from "./types";
import { PlusCircle } from "lucide-react";

export default function AppareilsPage() {
  const [activeTab, setActiveTab] = useState<string>("medical-devices");
  const [isOpen, setIsOpen] = useState(false);
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Fetch stock locations
  const { data: stockLocations } = useQuery({
    queryKey: ["stock-locations"],
    queryFn: async () => {
      const response = await fetch("/api/stock-locations");
      if (!response.ok) {
        throw new Error("Failed to fetch stock locations");
      }
      return response.json();
    },
  });

  // Add device mutation
  const addDeviceMutation = useMutation({
    mutationFn: async (newProduct: any) => {
      const response = await fetch("/api/medical-devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        throw new Error("Failed to add device");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-devices"] });
      setIsOpen(false);
      toast({
        title: "Succès",
        description: "L'appareil a été ajouté avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'appareil",
        variant: "destructive",
      });
    },
  });

  // Delete device mutation
  const deleteDeviceMutation = useMutation({
    mutationFn: async (product: Product) => {
      const response = await fetch(`/api/medical-devices/${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete device");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-devices"] });
      toast({
        title: "Succès",
        description: "L'appareil a été supprimé avec succès",
      });
    },
  });

  const handleEdit = async (product: Product) => {
    try {
      // Fetch complete product data when editing
      const response = await fetch(`/api/medical-devices/${product.id}`);
      if (!response.ok) {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les données du produit",
          variant: "destructive",
        });
        return;
      }
      const completeProduct = await response.json();
      
      // Transform numeric values to strings for form
      const formattedProduct = {
        ...completeProduct,
        purchasePrice: completeProduct.purchasePrice?.toString() || "",
        sellingPrice: completeProduct.sellingPrice?.toString() || "",
      };
      
      setCurrentProduct(formattedProduct);
      setIsEditMode(true);
      setIsOpen(true);
    } catch (error) {
      console.error("Error fetching product details:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération des données",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (isEditMode && currentProduct) {
        // Update existing product
        const response = await fetch(`/api/medical-devices/${currentProduct.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            type: currentProduct.type,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update device");
        }

        await queryClient.invalidateQueries({ queryKey: ["medical-devices"] });
        toast({
          title: "Succès",
          description: "L'appareil a été modifié avec succès",
        });
      } else {
        // Add new product
        await addDeviceMutation.mutateAsync(data);
      }
      
      // Reset form state
      setIsOpen(false);
      setCurrentProduct(null);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (product: Product) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet appareil ?")) {
      deleteDeviceMutation.mutate(product);
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  const getFormComponent = () => {
    if (!currentProduct && !isEditMode) {
      // For new products, show form based on active tab
      switch (activeTab) {
        case "medical-devices":
          return <MedicalDeviceForm onSubmit={handleSubmit} stockLocations={stockLocations || []} />;
        case "diagnostic-devices":
          return <DiagnosticDeviceForm onSubmit={handleSubmit} stockLocations={stockLocations || []} />;
        case "accessories":
          return <AccessoryForm onSubmit={handleSubmit} stockLocations={stockLocations || []} />;
        case "spare-parts":
          return <SparePartForm onSubmit={handleSubmit} stockLocations={stockLocations || []} />;
        default:
          return null;
      }
    }

    // For editing existing products
    if (currentProduct) {
      switch (currentProduct.type) {
        case "MEDICAL_DEVICE":
          return <MedicalDeviceForm initialData={currentProduct} onSubmit={handleSubmit} stockLocations={stockLocations || []} isEditMode />;
        case "DIAGNOSTIC_DEVICE":
          return <DiagnosticDeviceForm initialData={currentProduct} onSubmit={handleSubmit} stockLocations={stockLocations || []} isEditMode />;
        case "ACCESSORY":
          return <AccessoryForm initialData={currentProduct} onSubmit={handleSubmit} stockLocations={stockLocations || []} isEditMode />;
        case "SPARE_PART":
          return <SparePartForm initialData={currentProduct} onSubmit={handleSubmit} stockLocations={stockLocations || []} isEditMode />;
        default:
          return null;
      }
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Appareils</h1>
      </div>

      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-4">
        {activeTab === "medical-devices" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Appareils Médicaux</h2>
              <Dialog 
                open={isOpen} 
                onOpenChange={(open) => {
                  if (!open) {
                    setCurrentProduct(null);
                    setIsEditMode(false);
                  }
                  setIsOpen(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => { setIsEditMode(false); setCurrentProduct(null); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un appareil médical
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditMode ? "Modifier l'appareil médical" : "Ajouter un appareil médical"}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditMode ? "Modifier les informations de l'appareil médical" : "Ajouter un nouvel appareil médical au système"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    {getFormComponent()}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <MedicalDevicesTable
              products={products || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
        {activeTab === "diagnostic-devices" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Appareils de Diagnostic</h2>
              <Dialog 
                open={isOpen} 
                onOpenChange={(open) => {
                  if (!open) {
                    setCurrentProduct(null);
                    setIsEditMode(false);
                  }
                  setIsOpen(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => { setIsEditMode(false); setCurrentProduct(null); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un appareil de diagnostic
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditMode ? "Modifier l'appareil de diagnostic" : "Ajouter un appareil de diagnostic"}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditMode ? "Modifier les informations de l'appareil de diagnostic" : "Ajouter un nouvel appareil de diagnostic au système"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    {getFormComponent()}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <DiagnosticDevicesTable
              products={products || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
        {activeTab === "accessories" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Accessoires</h2>
              <Dialog 
                open={isOpen} 
                onOpenChange={(open) => {
                  if (!open) {
                    setCurrentProduct(null);
                    setIsEditMode(false);
                  }
                  setIsOpen(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => { setIsEditMode(false); setCurrentProduct(null); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un accessoire
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditMode ? "Modifier l'accessoire" : "Ajouter un accessoire"}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditMode ? "Modifier les informations de l'accessoire" : "Ajouter un nouvel accessoire au système"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    {getFormComponent()}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <AccessoriesTable
              products={products || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
        {activeTab === "spare-parts" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Pièces de Rechange</h2>
              <Dialog 
                open={isOpen} 
                onOpenChange={(open) => {
                  if (!open) {
                    setCurrentProduct(null);
                    setIsEditMode(false);
                  }
                  setIsOpen(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => { setIsEditMode(false); setCurrentProduct(null); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter une pièce de rechange
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditMode ? "Modifier la pièce de rechange" : "Ajouter une pièce de rechange"}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditMode ? "Modifier les informations de la pièce de rechange" : "Ajouter une nouvelle pièce de rechange au système"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    {getFormComponent()}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <SparePartsTable
              products={products || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
        {activeTab === "locations" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Emplacements</h2>
              <Dialog open={isLocationFormOpen} onOpenChange={setIsLocationFormOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un emplacement
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un emplacement</DialogTitle>
                  </DialogHeader>
                  <LocationForm onSuccess={() => setIsLocationFormOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
            <StockLocationsTable
              onEdit={(location) => {
                // Handle location edit
                console.log("Edit location:", location);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
