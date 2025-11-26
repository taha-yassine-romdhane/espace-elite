import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Settings, AlertCircle, Wind, Gauge, Clock, Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SaleProductParameterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: any; // The selected medical device article
  onParametersSaved: (articleId: string, parameters: any) => void;
}

// Device type detection based on name or category
const detectDeviceType = (deviceName: string, deviceType?: string): 'CPAP' | 'VNI' | 'CONCENTRATEUR' | 'BOUTEILLE' | 'OTHER' => {
  const name = deviceName?.toLowerCase() || '';
  const type = deviceType?.toLowerCase() || '';

  if (name.includes('cpap') || name.includes('ppc') || type.includes('cpap')) {
    return 'CPAP';
  }
  if (name.includes('vni') || name.includes('bipap') || name.includes('bi-pap') || type.includes('vni')) {
    return 'VNI';
  }
  if (name.includes('concentrateur') || name.includes('oxygen') || name.includes('o2') || type.includes('concentrateur')) {
    return 'CONCENTRATEUR';
  }
  if (name.includes('bouteille') || name.includes('cylinder') || type.includes('bouteille')) {
    return 'BOUTEILLE';
  }
  return 'OTHER';
};

export function SaleProductParameterDialog({
  open,
  onOpenChange,
  article,
  onParametersSaved
}: SaleProductParameterDialogProps) {
  const { toast } = useToast();

  // Detect device type
  const [deviceType, setDeviceType] = useState<'CPAP' | 'VNI' | 'CONCENTRATEUR' | 'BOUTEILLE' | 'OTHER'>('OTHER');

  // CPAP Parameters
  const [pression, setPression] = useState('');
  const [pressionRampe, setPressionRampe] = useState('');
  const [dureeRampe, setDureeRampe] = useState('');
  const [epr, setEpr] = useState('');
  const [autoPression, setAutoPression] = useState(false);
  const [autoRampe, setAutoRampe] = useState(false);

  // VNI Parameters
  const [ipap, setIpap] = useState('');
  const [epap, setEpap] = useState('');
  const [aid, setAid] = useState('');
  const [frequenceRespiratoire, setFrequenceRespiratoire] = useState('');
  const [volumeCourant, setVolumeCourant] = useState('');
  const [mode, setMode] = useState('');

  // Concentrateur & Bouteille
  const [debit, setDebit] = useState('');

  // Common
  const [notes, setNotes] = useState('');

  // Fetch device details to get type
  const { data: deviceData } = useQuery({
    queryKey: ['medical-device', article?.medicalDeviceId],
    queryFn: async () => {
      if (!article?.medicalDeviceId) return null;
      const response = await fetch(`/api/medical-devices/${article.medicalDeviceId}`);
      if (!response.ok) throw new Error('Failed to fetch device');
      return response.json();
    },
    enabled: open && !!article?.medicalDeviceId,
  });

  // Initialize device type and existing parameters
  useEffect(() => {
    if (article) {
      const detectedType = detectDeviceType(article.name, deviceData?.type);
      setDeviceType(detectedType);

      // Load existing parameters if any
      if (article.parameters) {
        const params = article.parameters;
        setPression(params.pression || '');
        setPressionRampe(params.pressionRampe || '');
        setDureeRampe(params.dureeRampe || '');
        setEpr(params.epr || '');
        setAutoPression(params.autoPression || false);
        setAutoRampe(params.autoRampe || false);
        setIpap(params.ipap || '');
        setEpap(params.epap || '');
        setAid(params.aid || '');
        setFrequenceRespiratoire(params.frequenceRespiratoire || '');
        setVolumeCourant(params.volumeCourant || '');
        setMode(params.mode || '');
        setDebit(params.debit || '');
        setNotes(params.notes || '');
      }
    }
  }, [article, deviceData]);

  const handleSubmit = () => {
    // Build parameters object based on device type
    const parameters: Record<string, any> = {
      deviceType,
      configuredAt: new Date().toISOString(),
    };

    if (deviceType === 'CPAP') {
      if (pression) parameters.pression = pression;
      if (pressionRampe) parameters.pressionRampe = pressionRampe;
      if (dureeRampe) parameters.dureeRampe = dureeRampe;
      if (epr) parameters.epr = epr;
      parameters.autoPression = autoPression;
      parameters.autoRampe = autoRampe;
    } else if (deviceType === 'VNI') {
      if (ipap) parameters.ipap = ipap;
      if (epap) parameters.epap = epap;
      if (aid) parameters.aid = aid;
      if (frequenceRespiratoire) parameters.frequenceRespiratoire = frequenceRespiratoire;
      if (volumeCourant) parameters.volumeCourant = volumeCourant;
      if (mode) parameters.mode = mode;
    } else if (deviceType === 'CONCENTRATEUR' || deviceType === 'BOUTEILLE') {
      if (debit) parameters.debit = debit;
    }

    if (notes) parameters.notes = notes;

    onParametersSaved(article.id, parameters);
    handleClose();
  };

  const handleClose = () => {
    // Reset all fields
    setPression('');
    setPressionRampe('');
    setDureeRampe('');
    setEpr('');
    setAutoPression(false);
    setAutoRampe(false);
    setIpap('');
    setEpap('');
    setAid('');
    setFrequenceRespiratoire('');
    setVolumeCourant('');
    setMode('');
    setDebit('');
    setNotes('');
    onOpenChange(false);
  };

  const renderCPAPParameters = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Pression */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-600" />
            Pression (cmH2O)
          </Label>
          <Input
            type="number"
            step="0.5"
            min="4"
            max="20"
            value={pression}
            onChange={(e) => setPression(e.target.value)}
            placeholder="Ex: 10"
          />
        </div>

        {/* Pression Rampe */}
        <div className="space-y-2">
          <Label>Pression Rampe (cmH2O)</Label>
          <Input
            type="number"
            step="0.5"
            min="4"
            max="20"
            value={pressionRampe}
            onChange={(e) => setPressionRampe(e.target.value)}
            placeholder="Ex: 4"
          />
        </div>

        {/* Duree Rampe */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            Durée Rampe (min)
          </Label>
          <Input
            type="number"
            min="0"
            max="60"
            value={dureeRampe}
            onChange={(e) => setDureeRampe(e.target.value)}
            placeholder="Ex: 20"
          />
        </div>

        {/* EPR */}
        <div className="space-y-2">
          <Label>EPR (Expiratory Pressure Relief)</Label>
          <Select value={epr} onValueChange={setEpr}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner EPR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Désactivé (0)</SelectItem>
              <SelectItem value="1">Niveau 1</SelectItem>
              <SelectItem value="2">Niveau 2</SelectItem>
              <SelectItem value="3">Niveau 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Switches */}
      <div className="flex gap-6 pt-2">
        <div className="flex items-center gap-2">
          <Switch
            id="autoPression"
            checked={autoPression}
            onCheckedChange={setAutoPression}
          />
          <Label htmlFor="autoPression">Auto-Pression (APAP)</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="autoRampe"
            checked={autoRampe}
            onCheckedChange={setAutoRampe}
          />
          <Label htmlFor="autoRampe">Auto-Rampe</Label>
        </div>
      </div>
    </div>
  );

  const renderVNIParameters = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* IPAP */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-blue-600" />
            IPAP (cmH2O)
          </Label>
          <Input
            type="number"
            step="0.5"
            min="4"
            max="30"
            value={ipap}
            onChange={(e) => setIpap(e.target.value)}
            placeholder="Ex: 14"
          />
        </div>

        {/* EPAP */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-green-600" />
            EPAP (cmH2O)
          </Label>
          <Input
            type="number"
            step="0.5"
            min="4"
            max="20"
            value={epap}
            onChange={(e) => setEpap(e.target.value)}
            placeholder="Ex: 6"
          />
        </div>

        {/* AI/D */}
        <div className="space-y-2">
          <Label>AI/D (Aide Inspiratoire)</Label>
          <Input
            type="number"
            step="0.5"
            value={aid}
            onChange={(e) => setAid(e.target.value)}
            placeholder="Ex: 8"
          />
        </div>

        {/* Mode */}
        <div className="space-y-2">
          <Label>Mode</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner le mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="S">Spontané (S)</SelectItem>
              <SelectItem value="T">Contrôlé (T)</SelectItem>
              <SelectItem value="ST">Spontané/Contrôlé (S/T)</SelectItem>
              <SelectItem value="PAC">PAC</SelectItem>
              <SelectItem value="APCV">APCV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Frequence Respiratoire */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-red-600" />
            Fréquence Respiratoire (/min)
          </Label>
          <Input
            type="number"
            min="6"
            max="30"
            value={frequenceRespiratoire}
            onChange={(e) => setFrequenceRespiratoire(e.target.value)}
            placeholder="Ex: 14"
          />
        </div>

        {/* Volume Courant */}
        <div className="space-y-2">
          <Label>Volume Courant (mL)</Label>
          <Input
            type="number"
            min="200"
            max="1200"
            value={volumeCourant}
            onChange={(e) => setVolumeCourant(e.target.value)}
            placeholder="Ex: 500"
          />
        </div>
      </div>
    </div>
  );

  const renderOxygenParameters = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Debit */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-blue-600" />
            Débit O2 (L/min)
          </Label>
          <Input
            type="number"
            step="0.5"
            min="0"
            max="15"
            value={debit}
            onChange={(e) => setDebit(e.target.value)}
            placeholder="Ex: 2"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Configuration de l'Appareil
          </DialogTitle>
          <DialogDescription>
            Paramètres du dispositif médical pour le patient
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-6 py-4">
            {/* Device Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-purple-900">{article?.name}</h3>
                  {article?.code && (
                    <p className="text-sm text-purple-700 mt-1">Code: {article.code}</p>
                  )}
                  {article?.serialNumber && (
                    <p className="text-sm text-purple-700">SN: {article.serialNumber}</p>
                  )}
                </div>
                <Badge className="bg-purple-100 text-purple-800">
                  {deviceType === 'CPAP' && 'CPAP/PPC'}
                  {deviceType === 'VNI' && 'VNI/BiPAP'}
                  {deviceType === 'CONCENTRATEUR' && 'Concentrateur O2'}
                  {deviceType === 'BOUTEILLE' && 'Bouteille O2'}
                  {deviceType === 'OTHER' && 'Appareil Médical'}
                </Badge>
              </div>
            </div>

            {/* Device Type Selector (if couldn't auto-detect) */}
            {deviceType === 'OTHER' && (
              <div className="space-y-2">
                <Label>Type d'appareil</Label>
                <Select value={deviceType} onValueChange={(val) => setDeviceType(val as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPAP">CPAP / PPC</SelectItem>
                    <SelectItem value="VNI">VNI / BiPAP</SelectItem>
                    <SelectItem value="CONCENTRATEUR">Concentrateur O2</SelectItem>
                    <SelectItem value="BOUTEILLE">Bouteille O2</SelectItem>
                    <SelectItem value="OTHER">Autre (sans paramètres)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Info Alert */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Configuration pour le patient</p>
                <p>Ces paramètres seront enregistrés avec la vente et associés au dossier du patient.</p>
              </div>
            </div>

            {/* Parameters based on device type */}
            {deviceType === 'CPAP' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-blue-600" />
                  Paramètres CPAP/PPC
                </h3>
                {renderCPAPParameters()}
              </div>
            )}

            {deviceType === 'VNI' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Wind className="h-4 w-4 text-green-600" />
                  Paramètres VNI/BiPAP
                </h3>
                {renderVNIParameters()}
              </div>
            )}

            {(deviceType === 'CONCENTRATEUR' || deviceType === 'BOUTEILLE') && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  Paramètres Oxygénothérapie
                </h3>
                {renderOxygenParameters()}
              </div>
            )}

            {deviceType === 'OTHER' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <Settings className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium">Type d'appareil non reconnu</p>
                <p className="text-sm text-gray-500 mt-1">
                  Sélectionnez un type ci-dessus ou continuez sans paramètres spécifiques.
                </p>
              </div>
            )}

            {/* Notes - Always visible */}
            <div className="space-y-2">
              <Label>Notes / Observations</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes additionnelles sur la configuration..."
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Enregistrer la configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
