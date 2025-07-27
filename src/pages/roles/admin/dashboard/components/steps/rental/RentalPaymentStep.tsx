import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDays, addMonths } from "date-fns";
import { 
  Loader2, 
  AlertTriangle
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  RentalPaymentPeriod,
  CNAMBondLocation,
  RentalPaymentStepProps,
  PaymentData
} from "./types";
import {
  generateTimeline,
  analyzeComprehensiveGaps,
  getUpcomingAlerts,
  analyzePaymentGaps,
  createPaymentPeriodForGap,
  initiateCnamRenewal,
  autoGeneratePaymentPeriods,
  calculateTotalPaymentAmount
} from "./utils";
import { CNAMBondsTab } from "./CNAMBondsTab";
import { PaymentPeriodsTab } from "./PaymentPeriodsTab";
import { GapsAlertsTab } from "./GapsAlertsTab";
import { DepositTab } from "./DepositTab";
import { SummaryTab } from "./SummaryTab";

export function RentalPaymentStep({
  selectedProducts,
  selectedClient,
  rentalDetails,
  calculateTotal,
  onBack,
  onComplete,
  isSubmitting = false
}: RentalPaymentStepProps) {
  const [paymentPeriods, setPaymentPeriods] = useState<RentalPaymentPeriod[]>([]);
  const [cnamBonds, setCnamBonds] = useState<CNAMBondLocation[]>([]);
  const [activeCnamBond, setActiveCnamBond] = useState<string>('');
  const [activePaymentPeriod, setActivePaymentPeriod] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('cnam');
  const [showTimeline, setShowTimeline] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositMethod, setDepositMethod] = useState<string>('CASH');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [patientStatus, setPatientStatus] = useState<'ACTIVE' | 'HOSPITALIZED' | 'DECEASED' | 'PAUSED'>('ACTIVE');

  // Generated timeline, gaps, and alerts
  const timeline = generateTimeline(rentalDetails, cnamBonds, paymentPeriods);
  const comprehensiveGaps = analyzeComprehensiveGaps(rentalDetails, cnamBonds, paymentPeriods, calculateTotal);
  const upcomingAlerts = getUpcomingAlerts(rentalDetails, cnamBonds, patientStatus);
  const paymentGaps = analyzePaymentGaps(paymentPeriods);

  // Handlers that use the utils functions
  const handleCreatePaymentPeriodForGap = (gap: any) => {
    createPaymentPeriodForGap(
      gap,
      selectedProducts,
      paymentPeriods,
      setPaymentPeriods,
      setActiveTab,
      setActivePaymentPeriod
    );
  };

  const handleInitiateCnamRenewal = (bondId: string) => {
    initiateCnamRenewal(
      bondId,
      cnamBonds,
      setCnamBonds,
      setActiveTab,
      setActiveCnamBond,
      toast
    );
  };

  const handleAutoGeneratePaymentPeriods = () => {
    autoGeneratePaymentPeriods(
      cnamBonds,
      rentalDetails,
      selectedProducts,
      calculateTotal,
      paymentPeriods,
      setPaymentPeriods,
      toast
    );
  };

  // Initialize payment periods based on rental details
  useEffect(() => {
    if (rentalDetails?.productPeriods) {
      const initialPeriods: RentalPaymentPeriod[] = [];
      
      // Create initial payment period for the entire rental
      const totalCost = calculateTotal();
      const startDate = new Date(rentalDetails.globalStartDate);
      const endDate = rentalDetails.globalEndDate ? new Date(rentalDetails.globalEndDate) : addMonths(startDate, 1);
      
      initialPeriods.push({
        id: `period-${Date.now()}`,
        productIds: selectedProducts.map(p => p.id),
        startDate,
        endDate,
        amount: totalCost,
        paymentMethod: selectedClient?.cnamId ? 'CNAM' : 'CASH',
        isGapPeriod: false,
        notes: ''
      });

      // If CNAM client, create potential gap periods
      if (selectedClient?.cnamId) {
        // Gap before CNAM approval (if urgent rental)
        if (rentalDetails.urgentRental) {
          initialPeriods.unshift({
            id: `gap-pre-${Date.now()}`,
            productIds: selectedProducts.map(p => p.id),
            startDate: startDate,
            endDate: addDays(startDate, 7), // Estimated 7 days for CNAM approval
            amount: (totalCost / 30) * 7, // 7 days worth
            paymentMethod: 'CASH',
            isGapPeriod: true,
            gapReason: 'CNAM_PENDING',
            notes: 'Période avant approbation CNAM'
          });
        }
      }

      setPaymentPeriods(initialPeriods);
      if (initialPeriods.length > 0) {
        setActivePaymentPeriod(initialPeriods[0].id);
      }
    }
  }, [rentalDetails, selectedClient, selectedProducts]);

  const handleSubmit = () => {
    const paymentData: PaymentData = {
      paymentPeriods,
      cnamBonds,
      depositAmount,
      depositMethod,
      totalAmount: calculateTotalPaymentAmount(paymentPeriods, depositAmount),
      notes: paymentNotes,
      gaps: comprehensiveGaps,
      upcomingAlerts: upcomingAlerts,
      patientStatus,
      cnamEligible: selectedClient?.cnamId ? true : false,
      autoCalculatedGaps: true, // Flag to indicate gaps can be auto-calculated
      isRental: true
    };

    onComplete(paymentData);
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div>
        <h2 className="text-xl font-semibold text-blue-900 mb-2">
          Gestion des Paiements de Location
        </h2>
        <p className="text-gray-600">
          Configurez les périodes de paiement, les bonds CNAM et surveillez les gaps
        </p>
      </div>

      {/* Payment Gaps Analysis */}
      {paymentGaps.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Analyse des Gaps ({paymentGaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paymentGaps.map((gap, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Badge variant={gap.type === 'cnam_expiring' ? 'destructive' : 'secondary'}>
                    {gap.type === 'cnam_expiring' ? 'CNAM' : 'Gap'}
                  </Badge>
                  <span>{gap.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cnam">Bonds CNAM</TabsTrigger>
          <TabsTrigger value="periods">Paiements</TabsTrigger>
          <TabsTrigger value="gaps">Gaps & Alertes</TabsTrigger>
          <TabsTrigger value="deposit">Caution</TabsTrigger>
          <TabsTrigger value="summary">Récapitulatif</TabsTrigger>
        </TabsList>

        {/* CNAM Bonds de Location Tab */}
        <TabsContent value="cnam" className="space-y-4">
          <CNAMBondsTab
            cnamBonds={cnamBonds}
            setCnamBonds={setCnamBonds}
            activeCnamBond={activeCnamBond}
            setActiveCnamBond={setActiveCnamBond}
            selectedClient={selectedClient}
            selectedProducts={selectedProducts}
            onAutoGeneratePaymentPeriods={handleAutoGeneratePaymentPeriods}
          />
        </TabsContent>

        <TabsContent value="periods" className="space-y-4">
          <PaymentPeriodsTab
            paymentPeriods={paymentPeriods}
            setPaymentPeriods={setPaymentPeriods}
            activePaymentPeriod={activePaymentPeriod}
            setActivePaymentPeriod={setActivePaymentPeriod}
            selectedClient={selectedClient}
            selectedProducts={selectedProducts}
            calculateTotal={calculateTotal}
          />
        </TabsContent>

        {/* Gaps & Alerts Tab */}
        <TabsContent value="gaps" className="space-y-4">
          <GapsAlertsTab
            patientStatus={patientStatus}
            setPatientStatus={setPatientStatus}
            showTimeline={showTimeline}
            setShowTimeline={setShowTimeline}
            timeline={timeline}
            comprehensiveGaps={comprehensiveGaps}
            upcomingAlerts={upcomingAlerts}
            onCreatePaymentPeriodForGap={handleCreatePaymentPeriodForGap}
            onInitiateCnamRenewal={handleInitiateCnamRenewal}
          />
        </TabsContent>

        <TabsContent value="deposit" className="space-y-4">
          <DepositTab
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            depositMethod={depositMethod}
            setDepositMethod={setDepositMethod}
          />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <SummaryTab
            cnamBonds={cnamBonds}
            paymentPeriods={paymentPeriods}
            comprehensiveGaps={comprehensiveGaps}
            depositAmount={depositAmount}
            depositMethod={depositMethod}
            patientStatus={patientStatus}
            paymentNotes={paymentNotes}
            setPaymentNotes={setPaymentNotes}
            calculateTotalPaymentAmount={() => calculateTotalPaymentAmount(paymentPeriods, depositAmount)}
          />
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Retour
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || paymentPeriods.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            "Suivant →"
          )}
        </Button>
      </div>
    </div>
  );
}