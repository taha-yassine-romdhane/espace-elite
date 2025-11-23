import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { FileText, AlertCircle, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SaleCNAMBonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleAmount: number;
  onCNAMBonCreated: (cnamBon: any, cnamPayment: any) => void;
}

export function SaleCNAMBonDialog({
  open,
  onOpenChange,
  saleAmount,
  onCNAMBonCreated
}: SaleCNAMBonDialogProps) {
  const { toast } = useToast();

  const [bonData, setBonData] = useState({
    bonType: '',
    dossierNumber: '',
    notes: ''
  });

  // Fetch ACHAT category nomenclature (for sales)
  const { data: nomenclatureData, isLoading } = useQuery({
    queryKey: ['cnam-nomenclature', 'ACHAT'],
    queryFn: async () => {
      const response = await fetch('/api/cnam-nomenclature?isActive=true&category=ACHAT');
      if (!response.ok) throw new Error('Failed to fetch nomenclature');
      return response.json();
    },
    enabled: open,
  });

  const nomenclature = Array.isArray(nomenclatureData) ? nomenclatureData : [];

  // Get selected nomenclature item
  const selectedNomenclature = nomenclature.find((item: any) => item.bonType === bonData.bonType);

  const updateField = (field: string, value: any) => {
    setBonData({ ...bonData, [field]: value });
  };

  const handleSubmit = () => {
    // Validation
    if (!bonData.bonType) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un type de bon CNAM',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedNomenclature) {
      toast({
        title: 'Erreur',
        description: 'Type de bon invalide',
        variant: 'destructive'
      });
      return;
    }

    // Create CNAM bon object
    const cnamBon = {
      id: `temp-cnam-${Date.now()}`,
      bonType: bonData.bonType,
      category: 'ACHAT',
      dossierNumber: bonData.dossierNumber || undefined,
      cnamMonthlyRate: Number(selectedNomenclature.monthlyRate) || 0,
      deviceMonthlyRate: 0, // Not applicable for sales
      coveredMonths: 1, // Always 1 for ACHAT/sales
      bonAmount: Number(selectedNomenclature.amount) || 0,
      notes: bonData.notes
    };

    // Create corresponding CNAM payment (auto-created by bon)
    const cnamPayment = {
      id: `temp-payment-${Date.now()}`,
      method: 'CNAM',
      amount: Number(selectedNomenclature.amount) || 0,
      date: new Date().toISOString().split('T')[0],
      notes: `Bon CNAM ${bonData.bonType}`,
      cnamBonId: cnamBon.id,
      dossierNumber: bonData.dossierNumber || undefined,
      cnamInfo: {
        bonType: bonData.bonType,
        bonAmount: Number(selectedNomenclature.amount) || 0,
        devicePrice: saleAmount || 0, // Use sale amount as device price
        complementAmount: 0, // No complement for ACHAT category
        currentStep: 1, // Initial step
        totalSteps: 7, // Standard 7 steps for CNAM
        status: 'EN_ATTENTE_APPROBATION', // Initial status
        notes: bonData.notes || undefined
      }
    };

    onCNAMBonCreated(cnamBon, cnamPayment);
    handleClose();
  };

  const handleClose = () => {
    setBonData({
      bonType: '',
      dossierNumber: '',
      notes: ''
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-8"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-6">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-600" />
            Créer un Bon CNAM (ACHAT)
          </DialogTitle>
          <DialogDescription>
            Bon CNAM pour vente - Le paiement sera automatiquement créé
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto px-2">
          {/* Info Alert */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Bons ACHAT disponibles pour les ventes</p>
              <p>Le bon CNAM créera automatiquement un paiement CNAM du même montant</p>
            </div>
          </div>

          {/* Bon Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type de bon CNAM <span className="text-red-500">*</span>
            </label>
            {isLoading ? (
              <div className="text-sm text-gray-500">Chargement des types de bons...</div>
            ) : nomenclature.length === 0 ? (
              <div className="text-sm text-red-500">Aucun bon ACHAT disponible</div>
            ) : (
              <Select value={bonData.bonType} onValueChange={(val) => updateField('bonType', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {nomenclature.map((item: any) => (
                    <SelectItem key={item.id} value={item.bonType}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{item.bonType}</span>
                        <Badge variant="outline" className="ml-auto bg-green-50 text-green-700">
                          {Number(item.amount).toFixed(2)} DT
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Bon Details */}
          {selectedNomenclature && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Détails du Bon</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Type:</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {selectedNomenclature.bonType}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Catégorie:</span>
                  <Badge className="bg-purple-100 text-purple-800">
                    ACHAT (Vente)
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Taux mensuel CNAM:</span>
                  <span className="font-bold text-gray-900">
                    {Number(selectedNomenclature.monthlyRate || 0).toFixed(2)} DT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Mois couverts:</span>
                  <span className="font-bold text-gray-900">1 mois</span>
                </div>
                <div className="border-t-2 border-green-300 pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Montant du bon:
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {Number(selectedNomenclature.amount).toFixed(2)} DT
                  </span>
                </div>
                {selectedNomenclature.description && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600 italic">{selectedNomenclature.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dossier Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Numéro de dossier CNAM (optionnel)
            </label>
            <Input
              value={bonData.dossierNumber}
              onChange={(e) => updateField('dossierNumber', e.target.value)}
              placeholder="Ex: DOSS-2024-001"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Notes
            </label>
            <Input
              value={bonData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Notes additionnelles..."
            />
          </div>

          {/* Payment Preview */}
          {selectedNomenclature && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Paiement automatique</p>
                  <p>
                    Un paiement CNAM de <strong>{Number(selectedNomenclature.amount).toFixed(2)} DT</strong> sera créé automatiquement
                    et lié à cette vente
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-6 border-t mt-6 px-2">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!bonData.bonType}
            className="bg-red-600 hover:bg-red-700"
          >
            Créer le Bon CNAM
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
