import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Clock, FileWarning } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CNAMFormProps {
  onSubmit: (data: any) => void;
  initialValues?: any;
  className?: string;
  onCancel?: () => void;
}

type CNAMDossierStatus = 'en_attente' | 'en_cours' | 'complement_dossier' | 'accepte' | 'refuse';

interface CNAMHistoryEntry {
  date: string;
  status: CNAMDossierStatus;
  note?: string;
  user: string;
}

export default function CNAMForm({ onSubmit, initialValues, className, onCancel }: CNAMFormProps) {
  // CNAM can only be a principal payment, not garantie or complement
  const [dossierStatus, setDossierStatus] = useState<CNAMDossierStatus>(initialValues?.etatDossier || 'en_attente');
  const [statusHistory, setStatusHistory] = useState<CNAMHistoryEntry[]>(initialValues?.statusHistory || []);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: initialValues || {
      etatDossier: 'en_attente',
      dateDepose: null,
      dateRappel: null,
      dateAcceptation: null,
      dateExpiration: null,
      montantPriseEnCharge: '',
      note: '',
      statusHistory: []
    }
  });

  useEffect(() => {
    // Update form when dossier status changes
    setValue('etatDossier', dossierStatus);
  }, [dossierStatus, setValue]);

  const handleFormSubmit = (data: any) => {
    // Add current status to history
    const newHistoryEntry: CNAMHistoryEntry = {
      date: new Date().toISOString(),
      status: dossierStatus,
      note: data.note,
      user: 'Admin' // This would ideally come from a user context
    };
    
    const updatedHistory = [...statusHistory, newHistoryEntry];
    setStatusHistory(updatedHistory);
    
    onSubmit({
      ...data,
      type: "cnam",
      classification: "principale", // CNAM can only be principale
      statusHistory: updatedHistory
    });
  };

  const handleStatusChange = (value: string) => {
    setDossierStatus(value as CNAMDossierStatus);
  };

  // Get the appropriate icon based on status
  const getStatusIcon = () => {
    switch(dossierStatus) {
      case 'en_attente':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'en_cours':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'complement_dossier':
        return <FileWarning className="h-5 w-5 text-orange-500" />;
      case 'accepte':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'refuse':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  // Get alert message based on status
  const getStatusAlert = () => {
    switch(dossierStatus) {
      case 'en_attente':
        return (
          <Alert className="bg-amber-50 border-amber-200">
            <Clock className="h-4 w-4 text-amber-500" />
            <AlertTitle>Dossier en attente</AlertTitle>
            <AlertDescription>Le dossier CNAM est en attente. Veuillez remplir la date de rappel et les notes.</AlertDescription>
          </Alert>
        );
      case 'en_cours':
        return (
          <Alert className="bg-blue-50 border-blue-200">
            <Clock className="h-4 w-4 text-blue-500" />
            <AlertTitle>Dossier en cours de traitement</AlertTitle>
            <AlertDescription>Le dossier CNAM est en cours de traitement. Veuillez remplir la date de dépôt, la date de rappel et les notes.</AlertDescription>
          </Alert>
        );
      case 'complement_dossier':
        return (
          <Alert className="bg-orange-50 border-orange-200">
            <FileWarning className="h-4 w-4 text-orange-500" />
            <AlertTitle>Complément de dossier requis</AlertTitle>
            <AlertDescription>Un complément de dossier est requis. Veuillez remplir la date de rappel et les notes.</AlertDescription>
          </Alert>
        );
      case 'accepte':
        return (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Dossier accepté</AlertTitle>
            <AlertDescription>Le dossier CNAM a été accepté. Veuillez remplir la date d'acceptation et la date d'expiration.</AlertDescription>
          </Alert>
        );
      case 'refuse':
        return (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle>Dossier refusé</AlertTitle>
            <AlertDescription>Le dossier CNAM a été refusé. Veuillez ajouter une note explicative.</AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn("space-y-6", className)}>
      <h2 className="text-xl font-semibold flex items-center gap-2">
        {getStatusIcon()}
        Paiement CNAM
      </h2>
      
      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
        <span className="font-medium">Classification:</span> Principal (uniquement)
      </div>
      
      {getStatusAlert()}
      
      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="etatDossier" className="font-medium">État de dossier CNAM</Label>
          <Select 
            onValueChange={handleStatusChange}
            value={dossierStatus}
          >
            <SelectTrigger id="etatDossier" className="w-full">
              <SelectValue placeholder="Sélectionner un état" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="complement_dossier">Complément de dossier</SelectItem>
              <SelectItem value="accepte">Accepté</SelectItem>
              <SelectItem value="refuse">Refusé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fields for En Attente */}
        {dossierStatus === 'en_attente' && (
          <>
            <div>
              <Label htmlFor="dateRappel" className="font-medium">Date rappel</Label>
              <DatePicker
                id="dateRappel"
                value={watch("dateRappel")}
                onChange={(date) => setValue("dateRappel", date)}
                placeholder="Choisir Date"
              />
            </div>
            <div>
              <Label htmlFor="note" className="font-medium">Note</Label>
              <Textarea 
                id="note"
                placeholder="Ajouter une note"
                {...register("note")}
              />
            </div>
          </>
        )}

        {/* Fields for En Cours */}
        {dossierStatus === 'en_cours' && (
          <>
            <div>
              <Label htmlFor="dateDepose" className="font-medium">Date dépôt</Label>
              <DatePicker
                id="dateDepose"
                value={watch("dateDepose")}
                onChange={(date) => setValue("dateDepose", date)}
                placeholder="Choisir Date"
              />
            </div>
            <div>
              <Label htmlFor="dateRappel" className="font-medium">Date rappel</Label>
              <DatePicker
                id="dateRappel"
                value={watch("dateRappel")}
                onChange={(date) => setValue("dateRappel", date)}
                placeholder="Choisir Date"
              />
            </div>
            <div>
              <Label htmlFor="note" className="font-medium">Note</Label>
              <Textarea 
                id="note"
                placeholder="Ajouter une note"
                {...register("note")}
              />
            </div>
          </>
        )}

        {/* Fields for Complément de dossier */}
        {dossierStatus === 'complement_dossier' && (
          <>
            <div>
              <Label htmlFor="dateRappel" className="font-medium">Date rappel</Label>
              <DatePicker
                id="dateRappel"
                value={watch("dateRappel")}
                onChange={(date) => setValue("dateRappel", date)}
                placeholder="Choisir Date"
              />
            </div>
            <div>
              <Label htmlFor="note" className="font-medium">Note</Label>
              <Textarea 
                id="note"
                placeholder="Ajouter une note"
                {...register("note")}
              />
            </div>
          </>
        )}

        {/* Fields for Accepté */}
        {dossierStatus === 'accepte' && (
          <>
            <div>
              <Label htmlFor="dateAcceptation" className="font-medium">Date acceptation</Label>
              <DatePicker
                id="dateAcceptation"
                value={watch("dateAcceptation")}
                onChange={(date) => setValue("dateAcceptation", date)}
                placeholder="Choisir Date"
              />
              {!watch("dateAcceptation") && (
                <p className="text-sm text-red-500 mt-1">Date d'acceptation requise</p>
              )}
            </div>
            <div>
              <Label htmlFor="dateExpiration" className="font-medium">Date expiration</Label>
              <DatePicker
                id="dateExpiration"
                value={watch("dateExpiration")}
                onChange={(date) => setValue("dateExpiration", date)}
                placeholder="Choisir Date"
              />
              {!watch("dateExpiration") && (
                <p className="text-sm text-red-500 mt-1">Date d'expiration requise</p>
              )}
            </div>
            <div>
              <Label htmlFor="montantPriseEnCharge" className="font-medium">Montant de prise en charge CNAM</Label>
              <Input 
                id="montantPriseEnCharge"
                placeholder="Valeur"
                {...register("montantPriseEnCharge", { required: "Montant de prise en charge est requis" })}
              />
              {errors.montantPriseEnCharge && (
                <p className="text-sm text-red-500 mt-1">{errors.montantPriseEnCharge.message as string}</p>
              )}
            </div>
          </>
        )}

        {/* Fields for Refusé */}
        {dossierStatus === 'refuse' && (
          <div>
            <Label htmlFor="note" className="font-medium">Motif de refus</Label>
            <Textarea 
              id="note"
              placeholder="Ajouter le motif de refus"
              {...register("note", { required: "Le motif de refus est requis" })}
            />
            {errors.note && (
              <p className="text-sm text-red-500 mt-1">{errors.note.message as string}</p>
            )}
          </div>
        )}

        {/* Status History */}
        {statusHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-medium mb-2">Historique du dossier</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Statut</th>
                    <th className="px-4 py-2 text-left">Note</th>
                    <th className="px-4 py-2 text-left">Utilisateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {statusHistory.map((entry, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        {entry.status === 'en_attente' && 'En attente'}
                        {entry.status === 'en_cours' && 'En cours'}
                        {entry.status === 'complement_dossier' && 'Complément de dossier'}
                        {entry.status === 'accepte' && 'Accepté'}
                        {entry.status === 'refuse' && 'Refusé'}
                      </td>
                      <td className="px-4 py-2">{entry.note || '-'}</td>
                      <td className="px-4 py-2">{entry.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit">
          {dossierStatus === 'refuse' ? 'Enregistrer le refus' : 'Sauvegarder'}
        </Button>
      </div>
    </form>
  );
}
