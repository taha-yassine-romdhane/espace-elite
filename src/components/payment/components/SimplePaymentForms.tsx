import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ControlledDatePicker } from './ControlledDatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SimplePaymentFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  totalRequired: number;
  initialValues?: any;
}

export const SimpleEspecesForm: React.FC<SimplePaymentFormProps> = ({ 
  onSubmit, 
  onCancel, 
  totalRequired,
  initialValues 
}) => {
  const [amount, setAmount] = useState(initialValues?.amount || totalRequired);
  const [received, setReceived] = useState(initialValues?.received || totalRequired);
  const [paymentDate, setPaymentDate] = useState(initialValues?.paymentDate || new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: 'especes',
      amount,
      received,
      paymentDate: format(paymentDate, 'yyyy-MM-dd'),
      classification: 'principale'
    });
  };

  const change = received - amount;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="amount">Montant à payer</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="received">Montant reçu</Label>
        <Input
          id="received"
          type="number"
          step="0.01"
          value={received}
          onChange={(e) => setReceived(parseFloat(e.target.value) || 0)}
          className="mt-1"
          required
        />
      </div>

      {change > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Monnaie à rendre: <strong>{change.toFixed(2)} DT</strong>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label>Date du paiement</Label>
        <div className="mt-1">
          <ControlledDatePicker
            value={paymentDate}
            onChange={(date) => {
              if (date) {
                setPaymentDate(date);
              }
            }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Valider le paiement
        </Button>
      </div>
    </form>
  );
};

export const SimpleChequeForm: React.FC<SimplePaymentFormProps> = ({ 
  onSubmit, 
  onCancel, 
  totalRequired,
  initialValues 
}) => {
  const [amount, setAmount] = useState(initialValues?.amount || totalRequired);
  const [chequeNumber, setChequeNumber] = useState(initialValues?.chequeNumber || '');
  const [bank, setBank] = useState(initialValues?.bank || '');
  const [paymentDate, setPaymentDate] = useState(initialValues?.paymentDate || new Date());
  const [notes, setNotes] = useState(initialValues?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: 'cheque',
      amount,
      chequeNumber,
      bank,
      paymentDate: format(paymentDate, 'yyyy-MM-dd'),
      notes,
      classification: 'principale'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="amount">Montant</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="chequeNumber">Numéro de chèque</Label>
        <Input
          id="chequeNumber"
          value={chequeNumber}
          onChange={(e) => setChequeNumber(e.target.value)}
          className="mt-1"
          placeholder="Ex: 123456"
          required
        />
      </div>

      <div>
        <Label htmlFor="bank">Banque</Label>
        <Input
          id="bank"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          className="mt-1"
          placeholder="Ex: BNA, UIB, STB..."
          required
        />
      </div>

      <div>
        <Label>Date du chèque</Label>
        <div className="mt-1">
          <ControlledDatePicker
            value={paymentDate}
            onChange={(date) => {
              if (date) {
                setPaymentDate(date);
              }
            }}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Valider le paiement
        </Button>
      </div>
    </form>
  );
};

export const SimpleVirementForm: React.FC<SimplePaymentFormProps> = ({ 
  onSubmit, 
  onCancel, 
  totalRequired,
  initialValues 
}) => {
  const [amount, setAmount] = useState(initialValues?.amount || totalRequired);
  const [reference, setReference] = useState(initialValues?.reference || '');
  const [bank, setBank] = useState(initialValues?.bank || '');
  const [paymentDate, setPaymentDate] = useState(initialValues?.paymentDate || new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: 'virement',
      amount,
      reference,
      bank,
      paymentDate: format(paymentDate, 'yyyy-MM-dd'),
      classification: 'principale'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="amount">Montant</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="reference">Référence du virement</Label>
        <Input
          id="reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="mt-1"
          placeholder="Ex: VIR123456"
          required
        />
      </div>

      <div>
        <Label htmlFor="bank">Banque</Label>
        <Input
          id="bank"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          className="mt-1"
          placeholder="Ex: BNA, UIB, STB..."
          required
        />
      </div>

      <div>
        <Label>Date du virement</Label>
        <div className="mt-1">
          <ControlledDatePicker
            value={paymentDate}
            onChange={(date) => {
              if (date) {
                setPaymentDate(date);
              }
            }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Valider le paiement
        </Button>
      </div>
    </form>
  );
};

export const SimpleTraiteForm: React.FC<SimplePaymentFormProps> = ({ 
  onSubmit, 
  onCancel, 
  totalRequired,
  initialValues 
}) => {
  const [amount, setAmount] = useState(initialValues?.amount || totalRequired);
  const [traiteNumber, setTraiteNumber] = useState(initialValues?.traiteNumber || '');
  const [bank, setBank] = useState(initialValues?.bank || '');
  const [dueDate, setDueDate] = useState(initialValues?.dueDate || new Date());
  const [notes, setNotes] = useState(initialValues?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: 'traite',
      amount,
      traiteNumber,
      bank,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      notes,
      classification: 'principale'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="amount">Montant</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="traiteNumber">Numéro de traite</Label>
        <Input
          id="traiteNumber"
          value={traiteNumber}
          onChange={(e) => setTraiteNumber(e.target.value)}
          className="mt-1"
          placeholder="Ex: TR123456"
          required
        />
      </div>

      <div>
        <Label htmlFor="bank">Banque</Label>
        <Input
          id="bank"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          className="mt-1"
          placeholder="Ex: BNA, UIB, STB..."
          required
        />
      </div>

      <div>
        <Label>Date d'échéance</Label>
        <div className="mt-1">
          <ControlledDatePicker
            value={dueDate}
            onChange={(date) => {
              if (date) {
                setDueDate(date);
              }
            }}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Valider le paiement
        </Button>
      </div>
    </form>
  );
};

export const SimpleMandatForm: React.FC<SimplePaymentFormProps> = ({ 
  onSubmit, 
  onCancel, 
  totalRequired,
  initialValues 
}) => {
  const [amount, setAmount] = useState(initialValues?.amount || totalRequired);
  const [mandatNumber, setMandatNumber] = useState(initialValues?.mandatNumber || '');
  const [paymentDate, setPaymentDate] = useState(initialValues?.paymentDate || new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: 'mandat',
      amount,
      mandatNumber,
      paymentDate: format(paymentDate, 'yyyy-MM-dd'),
      classification: 'principale'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="amount">Montant</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="mandatNumber">Numéro de mandat</Label>
        <Input
          id="mandatNumber"
          value={mandatNumber}
          onChange={(e) => setMandatNumber(e.target.value)}
          className="mt-1"
          placeholder="Ex: MD123456"
          required
        />
      </div>

      <div>
        <Label>Date du mandat</Label>
        <div className="mt-1">
          <ControlledDatePicker
            value={paymentDate}
            onChange={(date) => {
              if (date) {
                setPaymentDate(date);
              }
            }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Valider le paiement
        </Button>
      </div>
    </form>
  );
};

export const SimpleCNAMForm: React.FC<SimplePaymentFormProps & { selectedProducts?: any[] }> = ({ 
  onSubmit, 
  onCancel, 
  totalRequired,
  initialValues,
  selectedProducts = []
}) => {
  const [bondType, setBondType] = useState(initialValues?.bondType || '');
  const [dossierNumber, setDossierNumber] = useState(initialValues?.dossierNumber || '');
  const [bondAmount, setBondAmount] = useState(initialValues?.bondAmount || 0);

  const BOND_TYPES = [
    { id: 'masque', label: 'Bond Masque', amount: 200 },
    { id: 'cpap', label: 'Bond CPAP', amount: 1475 },
    { id: 'autre', label: 'Autre', amount: 0 }
  ];

  // Calculate if complement is needed
  const needsComplement = totalRequired > bondAmount;
  const complementAmount = needsComplement ? totalRequired - bondAmount : 0;

  const handleBondTypeChange = (type: string) => {
    setBondType(type);
    const bond = BOND_TYPES.find(b => b.id === type);
    if (bond && bond.amount > 0) {
      setBondAmount(bond.amount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: 'cnam',
      amount: bondAmount, // CNAM payment is the bond amount
      bondType,
      dossierNumber,
      classification: 'principale',
      cnamInfo: {
        bondType,
        currentStep: 1, // Step 1 = En attente d'approbation CNAM
        totalSteps: 7,
        status: 'en_attente_approbation', // Waiting for CNAM approval
        bondAmount,
        devicePrice: totalRequired,
        complementAmount: needsComplement ? complementAmount : 0
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Le paiement CNAM couvre le montant du bond. Le dossier sera en attente d'approbation CNAM.
        </AlertDescription>
      </Alert>

      {needsComplement && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p><strong>Complément requis:</strong></p>
              <p>Prix total: {totalRequired.toFixed(2)} DT</p>
              <p>Bond CNAM: {bondAmount.toFixed(2)} DT</p>
              <p className="font-medium text-amber-800">Complément: {complementAmount.toFixed(2)} DT</p>
              <p className="text-sm">Un paiement supplémentaire sera nécessaire.</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="bondType">Type de bond</Label>
        <Select value={bondType} onValueChange={handleBondTypeChange}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Sélectionnez un type de bond" />
          </SelectTrigger>
          <SelectContent>
            {BOND_TYPES.map(bond => (
              <SelectItem key={bond.id} value={bond.id}>
                {bond.label} {bond.amount > 0 && `(${bond.amount} DT)`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="dossierNumber">Numéro de dossier CNAM</Label>
        <Input
          id="dossierNumber"
          value={dossierNumber}
          onChange={(e) => setDossierNumber(e.target.value)}
          className="mt-1"
          placeholder="Ex: CNAM-2024-001"
          required
        />
      </div>

      <div>
        <Label htmlFor="bondAmount">Montant du bond CNAM</Label>
        <Input
          id="bondAmount"
          type="number"
          step="0.01"
          value={bondAmount}
          onChange={(e) => setBondAmount(parseFloat(e.target.value) || 0)}
          className="mt-1"
          required
          disabled={bondType && bondType !== 'autre'}
        />
        <p className="text-xs text-gray-500 mt-1">
          Ce montant sera payé maintenant. {needsComplement && `Le complément de ${complementAmount.toFixed(2)} DT sera payé séparément.`}
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Créer le dossier CNAM
        </Button>
      </div>
    </form>
  );
};