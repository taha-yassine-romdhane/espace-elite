import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, AlertCircle, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SalePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientType: 'PATIENT' | 'COMPANY';
  remainingAmount: number;
  onPaymentAdded: (payment: any) => void;
  onCNAMSelected: () => void;
}

export function SalePaymentDialog({
  open,
  onOpenChange,
  clientType,
  remainingAmount,
  onPaymentAdded,
  onCNAMSelected
}: SalePaymentDialogProps) {
  const { toast } = useToast();

  const [paymentData, setPaymentData] = useState({
    method: 'CASH',
    amount: Number(remainingAmount) || 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    // Method-specific fields
    chequeNumber: '',
    bank: '',
    reference: '',
    traiteNumber: '',
    dueDate: '',
    mandatNumber: ''
  });

  const paymentMethods = [
    { value: 'CASH', label: 'Espèce' },
    { value: 'CHEQUE', label: 'Chèque' },
    { value: 'VIREMENT', label: 'Virement' },
    { value: 'TRAITE', label: 'Traite' },
    { value: 'MANDAT', label: 'Mandat' },
    ...(clientType === 'PATIENT' ? [{ value: 'CNAM', label: 'CNAM' }] : [])
  ];

  const handleMethodChange = (method: string) => {
    // If CNAM selected, open CNAM bon dialog instead
    if (method === 'CNAM') {
      onCNAMSelected();
      onOpenChange(false);
      return;
    }

    setPaymentData({ ...paymentData, method });
  };

  const updateField = (field: string, value: any) => {
    setPaymentData({ ...paymentData, [field]: value });
  };

  const handleSubmit = () => {
    // Validation
    if (!paymentData.amount || paymentData.amount <= 0) {
      toast({
        title: 'Erreur',
        description: 'Montant invalide',
        variant: 'destructive'
      });
      return;
    }

    if (paymentData.amount > remainingAmount) {
      toast({
        title: 'Attention',
        description: `Le montant dépasse le reste à payer (${remainingAmount.toFixed(2)} DT)`,
        variant: 'destructive'
      });
      return;
    }

    // Method-specific validation
    if (paymentData.method === 'CHEQUE' && !paymentData.chequeNumber) {
      toast({
        title: 'Erreur',
        description: 'Numéro de chèque requis',
        variant: 'destructive'
      });
      return;
    }

    if (paymentData.method === 'VIREMENT' && !paymentData.reference) {
      toast({
        title: 'Erreur',
        description: 'Référence de virement requise',
        variant: 'destructive'
      });
      return;
    }

    if (paymentData.method === 'TRAITE' && (!paymentData.traiteNumber || !paymentData.dueDate)) {
      toast({
        title: 'Erreur',
        description: 'Numéro de traite et date d\'échéance requis',
        variant: 'destructive'
      });
      return;
    }

    if (paymentData.method === 'MANDAT' && !paymentData.mandatNumber) {
      toast({
        title: 'Erreur',
        description: 'Numéro de mandat requis',
        variant: 'destructive'
      });
      return;
    }

    const payment = {
      id: `temp-${Date.now()}-${Math.random()}`,
      method: paymentData.method,
      amount: Number(paymentData.amount) || 0,
      date: paymentData.date,
      notes: paymentData.notes,
      chequeNumber: paymentData.method === 'CHEQUE' ? paymentData.chequeNumber : undefined,
      bank: paymentData.method === 'CHEQUE' || paymentData.method === 'VIREMENT' ? paymentData.bank : undefined,
      reference: paymentData.method === 'VIREMENT' ? paymentData.reference : undefined,
      traiteNumber: paymentData.method === 'TRAITE' ? paymentData.traiteNumber : undefined,
      dueDate: paymentData.method === 'TRAITE' ? paymentData.dueDate : undefined,
      mandatNumber: paymentData.method === 'MANDAT' ? paymentData.mandatNumber : undefined
    };

    onPaymentAdded(payment);
    handleClose();
  };

  const handleClose = () => {
    setPaymentData({
      method: 'CASH',
      amount: Number(remainingAmount) || 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      chequeNumber: '',
      bank: '',
      reference: '',
      traiteNumber: '',
      dueDate: '',
      mandatNumber: ''
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
            <CreditCard className="h-5 w-5 text-blue-600" />
            Ajouter un Paiement
          </DialogTitle>
          <DialogDescription>
            Reste à payer: {remainingAmount.toFixed(2)} DT
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto px-2">
          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Méthode de paiement <span className="text-red-500">*</span>
            </label>
            <Select value={paymentData.method} onValueChange={handleMethodChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CNAM Info */}
          {clientType === 'PATIENT' && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Option CNAM disponible</p>
                <p>Le paiement CNAM créera automatiquement un bon CNAM lié à cette vente</p>
              </div>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Montant (DT) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max={remainingAmount}
              value={paymentData.amount}
              onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              Date de paiement <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={paymentData.date}
              onChange={(e) => updateField('date', e.target.value)}
            />
          </div>

          {/* Method-Specific Fields */}
          {paymentData.method === 'CHEQUE' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Numéro de chèque <span className="text-red-500">*</span>
                </label>
                <Input
                  value={paymentData.chequeNumber}
                  onChange={(e) => updateField('chequeNumber', e.target.value)}
                  placeholder="Ex: 1234567"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Banque
                </label>
                <Input
                  value={paymentData.bank}
                  onChange={(e) => updateField('bank', e.target.value)}
                  placeholder="Ex: STB, BIAT, BNA..."
                />
              </div>
            </>
          )}

          {paymentData.method === 'VIREMENT' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Référence <span className="text-red-500">*</span>
                </label>
                <Input
                  value={paymentData.reference}
                  onChange={(e) => updateField('reference', e.target.value)}
                  placeholder="Ex: VIR-2024-001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Banque
                </label>
                <Input
                  value={paymentData.bank}
                  onChange={(e) => updateField('bank', e.target.value)}
                  placeholder="Ex: STB, BIAT, BNA..."
                />
              </div>
            </>
          )}

          {paymentData.method === 'TRAITE' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Numéro de traite <span className="text-red-500">*</span>
                </label>
                <Input
                  value={paymentData.traiteNumber}
                  onChange={(e) => updateField('traiteNumber', e.target.value)}
                  placeholder="Ex: TR-2024-001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Date d'échéance <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={paymentData.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                />
              </div>
            </>
          )}

          {paymentData.method === 'MANDAT' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Numéro de mandat <span className="text-red-500">*</span>
              </label>
              <Input
                value={paymentData.mandatNumber}
                onChange={(e) => updateField('mandatNumber', e.target.value)}
                placeholder="Ex: MAN-2024-001"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              value={paymentData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Notes additionnelles..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-6 border-t mt-6 px-2">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Ajouter le paiement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
