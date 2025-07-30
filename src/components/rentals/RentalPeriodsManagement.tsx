import React, { useState } from 'react';
import { format, differenceInDays, addDays, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

interface RentalPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  paymentMethod: string;
  isGapPeriod: boolean;
  gapReason?: string;
  notes?: string;
  paymentId?: string;
  cnamBondId?: string;
}

interface RentalPeriodsManagementProps {
  rental: any;
  rentalPeriods: RentalPeriod[];
  onUpdate?: (periods: RentalPeriod[]) => void;
}

export default function RentalPeriodsManagement({ rental, rentalPeriods, onUpdate }: RentalPeriodsManagementProps) {
  const [periods, setPeriods] = useState<RentalPeriod[]>(rentalPeriods || []);
  const [editingPeriod, setEditingPeriod] = useState<RentalPeriod | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPeriod, setNewPeriod] = useState<Partial<RentalPeriod>>({
    paymentMethod: 'CASH',
    isGapPeriod: false,
    amount: 0,
  });

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'PPP', { locale: fr });
  };

  const calculateDuration = (startDate: Date, endDate: Date) => {
    return differenceInDays(endDate, startDate) + 1;
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      CASH: 'bg-green-100 text-green-800 border-green-200',
      CNAM: 'bg-blue-100 text-blue-800 border-blue-200',
      CHEQUE: 'bg-purple-100 text-purple-800 border-purple-200',
      BANK_TRANSFER: 'bg-orange-100 text-orange-800 border-orange-200',
      MAD: 'bg-pink-100 text-pink-800 border-pink-200',
      TRAITE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    const labels = {
      CASH: 'Espèces',
      CNAM: 'CNAM',
      CHEQUE: 'Chèque',
      BANK_TRANSFER: 'Virement',
      MAD: 'MAD',
      TRAITE: 'Traite',
    };

    return (
      <Badge variant="outline" className={colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        <CreditCard className="h-3 w-3 mr-1" />
        {labels[method as keyof typeof labels] || method}
      </Badge>
    );
  };

  const detectGaps = () => {
    if (periods.length === 0) return [];
    
    const sortedPeriods = [...periods].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const gaps = [];
    
    for (let i = 0; i < sortedPeriods.length - 1; i++) {
      const currentEnd = new Date(sortedPeriods[i].endDate);
      const nextStart = new Date(sortedPeriods[i + 1].startDate);
      
      if (isAfter(nextStart, addDays(currentEnd, 1))) {
        gaps.push({
          start: addDays(currentEnd, 1),
          end: addDays(nextStart, -1),
          duration: differenceInDays(nextStart, addDays(currentEnd, 1)),
        });
      }
    }
    
    return gaps;
  };

  const handleSaveNewPeriod = () => {
    if (!newPeriod.startDate || !newPeriod.endDate) {
      return;
    }

    const period: RentalPeriod = {
      id: `new-${Date.now()}`,
      startDate: newPeriod.startDate,
      endDate: newPeriod.endDate,
      amount: newPeriod.amount || 0,
      paymentMethod: newPeriod.paymentMethod || 'CASH',
      isGapPeriod: newPeriod.isGapPeriod || false,
      gapReason: newPeriod.gapReason,
      notes: newPeriod.notes,
    };

    const updatedPeriods = [...periods, period];
    setPeriods(updatedPeriods);
    onUpdate?.(updatedPeriods);
    setShowAddDialog(false);
    setNewPeriod({
      paymentMethod: 'CASH',
      isGapPeriod: false,
      amount: 0,
    });
  };

  const handleEditPeriod = (period: RentalPeriod) => {
    setEditingPeriod({ ...period });
  };

  const handleSaveEdit = () => {
    if (!editingPeriod) return;

    const updatedPeriods = periods.map(period => 
      period.id === editingPeriod.id ? editingPeriod : period
    );
    setPeriods(updatedPeriods);
    onUpdate?.(updatedPeriods);
    setEditingPeriod(null);
  };

  const handleDeletePeriod = (periodId: string) => {
    const updatedPeriods = periods.filter(period => period.id !== periodId);
    setPeriods(updatedPeriods);
    onUpdate?.(updatedPeriods);
  };

  const handleCreateGapPeriod = (gap: any) => {
    const gapPeriod: Partial<RentalPeriod> = {
      startDate: gap.start,
      endDate: gap.end,
      amount: 0,
      paymentMethod: 'CASH',
      isGapPeriod: true,
      gapReason: 'Gap automatiquement détecté',
    };
    setNewPeriod(gapPeriod);
    setShowAddDialog(true);
  };

  const gaps = detectGaps();
  const totalAmount = periods.reduce((sum, period) => sum + (period.isGapPeriod ? 0 : period.amount), 0);
  const totalDuration = periods.reduce((sum, period) => sum + calculateDuration(period.startDate, period.endDate), 0);

  return (
    <div className="space-y-6">
      {/* Header with Add Button and Summary */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Gestion des Périodes de Location
          </h2>
          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            <span>Total: {totalAmount.toFixed(2)} TND</span>
            <span>Durée: {totalDuration} jours</span>
            <span>Périodes: {periods.length}</span>
          </div>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Période
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle période</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Date de Début</Label>
                  <DatePicker
                    value={newPeriod.startDate}
                    onChange={(date) => setNewPeriod({ ...newPeriod, startDate: date })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">Date de Fin</Label>
                  <DatePicker
                    value={newPeriod.endDate}
                    onChange={(date) => setNewPeriod({ ...newPeriod, endDate: date })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="amount">Montant (TND)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newPeriod.amount || 0}
                    onChange={(e) => setNewPeriod({ ...newPeriod, amount: parseFloat(e.target.value) || 0 })}
                    disabled={newPeriod.isGapPeriod}
                  />
                </div>
                
                <div>
                  <Label htmlFor="paymentMethod">Méthode de Paiement</Label>
                  <Select value={newPeriod.paymentMethod} onValueChange={(value) => setNewPeriod({ ...newPeriod, paymentMethod: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Espèces</SelectItem>
                      <SelectItem value="CNAM">CNAM</SelectItem>
                      <SelectItem value="CHEQUE">Chèque</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Virement</SelectItem>
                      <SelectItem value="MAD">MAD</SelectItem>
                      <SelectItem value="TRAITE">Traite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isGapPeriod"
                  checked={newPeriod.isGapPeriod}
                  onCheckedChange={(checked) => setNewPeriod({ 
                    ...newPeriod, 
                    isGapPeriod: !!checked,
                    amount: checked ? 0 : newPeriod.amount 
                  })}
                />
                <Label htmlFor="isGapPeriod">Période de gap (non facturée)</Label>
              </div>
              
              {newPeriod.isGapPeriod && (
                <div>
                  <Label htmlFor="gapReason">Raison du Gap</Label>
                  <Input
                    id="gapReason"
                    value={newPeriod.gapReason || ''}
                    onChange={(e) => setNewPeriod({ ...newPeriod, gapReason: e.target.value })}
                    placeholder="Ex: Patient hospitalisé, appareil en maintenance..."
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newPeriod.notes || ''}
                  onChange={(e) => setNewPeriod({ ...newPeriod, notes: e.target.value })}
                  placeholder="Notes additionnelles..."
                  rows={3}
                />
              </div>
              
              {newPeriod.startDate && newPeriod.endDate && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    Durée: {calculateDuration(newPeriod.startDate, newPeriod.endDate)} jours
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={handleSaveNewPeriod} className="flex items-center gap-1">
                  <Save className="h-3.5 w-3.5" />
                  Ajouter la Période
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gap Detection Alert */}
      {gaps.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex justify-between items-center">
              <span>{gaps.length} gap(s) détecté(s) entre les périodes de location.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateGapPeriod(gaps[0])}
                className="ml-2"
              >
                Créer Période de Gap
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Rental Periods Table */}
      {periods.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((period) => (
                    <TableRow key={period.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div>Du {formatDate(period.startDate)}</div>
                          <div>Au {formatDate(period.endDate)}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">
                          {calculateDuration(period.startDate, period.endDate)} jours
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {period.isGapPeriod ? (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800">
                            Non facturé
                          </Badge>
                        ) : (
                          <div className="font-medium">{period.amount.toFixed(2)} TND</div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {getPaymentMethodBadge(period.paymentMethod)}
                      </TableCell>
                      
                      <TableCell>
                        {period.isGapPeriod ? (
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Gap
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Facturé
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPeriod(period)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePeriod(period.id)}
                            className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune période définie</h3>
            <p className="text-gray-600 mb-4">
              Aucune période de location n'a été définie pour cette location.
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" />
              Ajouter une Période
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Period Dialog */}
      {editingPeriod && (
        <Dialog open={!!editingPeriod} onOpenChange={() => setEditingPeriod(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier la période</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editStartDate">Date de Début</Label>
                  <DatePicker
                    value={editingPeriod.startDate}
                    onChange={(date) => setEditingPeriod({ ...editingPeriod, startDate: date! })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editEndDate">Date de Fin</Label>
                  <DatePicker
                    value={editingPeriod.endDate}
                    onChange={(date) => setEditingPeriod({ ...editingPeriod, endDate: date! })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editAmount">Montant (TND)</Label>
                  <Input
                    id="editAmount"
                    type="number"
                    step="0.01"
                    value={editingPeriod.amount}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, amount: parseFloat(e.target.value) || 0 })}
                    disabled={editingPeriod.isGapPeriod}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editPaymentMethod">Méthode de Paiement</Label>
                  <Select value={editingPeriod.paymentMethod} onValueChange={(value) => setEditingPeriod({ ...editingPeriod, paymentMethod: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Espèces</SelectItem>
                      <SelectItem value="CNAM">CNAM</SelectItem>
                      <SelectItem value="CHEQUE">Chèque</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Virement</SelectItem>
                      <SelectItem value="MAD">MAD</SelectItem>
                      <SelectItem value="TRAITE">Traite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editIsGapPeriod"
                  checked={editingPeriod.isGapPeriod}
                  onCheckedChange={(checked) => setEditingPeriod({ 
                    ...editingPeriod, 
                    isGapPeriod: !!checked,
                    amount: checked ? 0 : editingPeriod.amount 
                  })}
                />
                <Label htmlFor="editIsGapPeriod">Période de gap (non facturée)</Label>
              </div>
              
              {editingPeriod.isGapPeriod && (
                <div>
                  <Label htmlFor="editGapReason">Raison du Gap</Label>
                  <Input
                    id="editGapReason"
                    value={editingPeriod.gapReason || ''}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, gapReason: e.target.value })}
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea
                  id="editNotes"
                  value={editingPeriod.notes || ''}
                  onChange={(e) => setEditingPeriod({ ...editingPeriod, notes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} className="flex items-center gap-1">
                  <Save className="h-3.5 w-3.5" />
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => setEditingPeriod(null)}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Gap Details */}
      {gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Gaps Détectés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gaps.map((gap, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div>
                    <div className="font-medium">
                      Du {formatDate(gap.start)} au {formatDate(gap.end)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Durée: {gap.duration} jours
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateGapPeriod(gap)}
                    className="border-orange-200 text-orange-800 hover:bg-orange-100"
                  >
                    Créer Période
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}