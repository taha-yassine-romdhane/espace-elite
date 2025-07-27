import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Shield, 
  CreditCard, 
  AlertTriangle
} from "lucide-react";
import { CNAMBondLocation, RentalPaymentPeriod, CNAMStatus, GapReason } from "./types";

interface SummaryTabProps {
  cnamBonds: CNAMBondLocation[];
  paymentPeriods: RentalPaymentPeriod[];
  comprehensiveGaps: any[];
  depositAmount: number;
  depositMethod: string;
  patientStatus: 'ACTIVE' | 'HOSPITALIZED' | 'DECEASED' | 'PAUSED';
  paymentNotes: string;
  setPaymentNotes: (notes: string) => void;
  calculateTotalPaymentAmount: () => number;
}

const cnamStatuses: CNAMStatus[] = [
  { value: 'EN_ATTENTE_APPROBATION', label: 'En attente d\'approbation', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'APPROUVE', label: 'Approuvé', color: 'bg-green-100 text-green-800' },
  { value: 'EN_COURS', label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  { value: 'TERMINE', label: 'Terminé', color: 'bg-gray-100 text-gray-800' },
  { value: 'REFUSE', label: 'Refusé', color: 'bg-red-100 text-red-800' }
];

const gapReasons: GapReason[] = [
  { value: 'CNAM_PENDING', label: 'CNAM en attente d\'approbation' },
  { value: 'CNAM_EXPIRED', label: 'CNAM expiré/terminé' },
  { value: 'PATIENT_PAUSE', label: 'Pause demandée par le patient' },
  { value: 'MAINTENANCE', label: 'Maintenance de l\'appareil' },
  { value: 'OTHER', label: 'Autre raison' }
];

export function SummaryTab({
  cnamBonds,
  paymentPeriods,
  comprehensiveGaps,
  depositAmount,
  depositMethod,
  patientStatus,
  paymentNotes,
  setPaymentNotes,
  calculateTotalPaymentAmount
}: SummaryTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif Complet de la Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CNAM Bonds Summary */}
          {cnamBonds.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Bonds CNAM ({cnamBonds.length})
              </h4>
              {cnamBonds.map((bond, index) => (
                <div key={bond.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <div className="font-medium">
                      Bond {index + 1}: {bond.bondNumber || 'En cours'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {bond.coveredMonths} mois - {bond.bondType}
                    </div>
                    <div className="text-xs">
                      <Badge className={cnamStatuses.find(s => s.value === bond.status)?.color}>
                        {cnamStatuses.find(s => s.value === bond.status)?.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{bond.totalAmount.toFixed(2)} TND</div>
                    {bond.startDate && bond.endDate && (
                      <div className="text-xs text-gray-600">
                        {format(bond.startDate, "dd/MM", { locale: fr })} - {format(bond.endDate, "dd/MM/yyyy", { locale: fr })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payment Periods Summary */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-600" />
              Périodes de paiement ({paymentPeriods.length})
            </h4>
            {paymentPeriods.map((period, index) => (
              <div key={period.id} className={`flex justify-between items-center p-3 rounded-lg border ${
                period.isGapPeriod ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div>
                  <span className="font-medium">
                    {period.isGapPeriod ? 'Gap' : `Période ${index + 1}`}
                  </span>
                  <div className="text-sm text-gray-600">
                    {format(period.startDate, "dd/MM/yyyy", { locale: fr })} - {format(period.endDate, "dd/MM/yyyy", { locale: fr })}
                  </div>
                  {period.isGapPeriod && (
                    <div className="text-xs text-orange-600">
                      Raison: {gapReasons.find(r => r.value === period.gapReason)?.label}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold">{period.amount.toFixed(2)} TND</div>
                  <div className="text-sm text-gray-600">{period.paymentMethod}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Gaps Summary */}
          {comprehensiveGaps.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-4 w-4" />
                Gaps Identifiés ({comprehensiveGaps.length})
              </h4>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                {comprehensiveGaps.map((gap, index) => (
                  <div key={index} className="text-sm mb-1">
                    • {gap.title}: {gap.duration} jours ({gap.amount?.toFixed(2)} TND)
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deposit Summary */}
          {depositAmount > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Caution</h4>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span>Dépôt de garantie</span>
                <div className="text-right">
                  <div className="font-semibold">{depositAmount.toFixed(2)} TND</div>
                  <div className="text-sm text-gray-600">{depositMethod}</div>
                </div>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span>Total CNAM</span>
              <span className="font-semibold">
                {cnamBonds.reduce((sum, bond) => sum + bond.totalAmount, 0).toFixed(2)} TND
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Paiements Directs</span>
              <span className="font-semibold">
                {paymentPeriods.reduce((sum, period) => sum + period.amount, 0).toFixed(2)} TND
              </span>
            </div>
            {depositAmount > 0 && (
              <div className="flex justify-between items-center">
                <span>Caution</span>
                <span className="font-semibold">{depositAmount.toFixed(2)} TND</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
              <span>Total Général</span>
              <span className="text-blue-600">{calculateTotalPaymentAmount().toFixed(2)} TND</span>
            </div>
          </div>

          {/* Patient Status */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Statut du Patient</span>
              <Badge variant={patientStatus === 'ACTIVE' ? 'default' : 
                            patientStatus === 'DECEASED' ? 'destructive' : 'secondary'}>
                {patientStatus === 'ACTIVE' ? 'Actif' :
                 patientStatus === 'HOSPITALIZED' ? 'Hospitalisé' :
                 patientStatus === 'DECEASED' ? 'Décédé' : 'En pause'}
              </Badge>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes générales sur la location</Label>
            <Textarea
              placeholder="Instructions spéciales, conditions de location, informations importantes..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}