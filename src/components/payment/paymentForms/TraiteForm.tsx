import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus } from "lucide-react";

interface TraiteFormProps {
  onSubmit: (data: any) => void;
  initialValues?: any;
  className?: string;
}

export default function TraiteForm({ onSubmit, initialValues, className }: TraiteFormProps) {
  const [classification, setClassification] = useState<"principal" | "garantie" | "complement">("principal");
  const [payeeToSociete, setPayeeToSociete] = useState<"oui" | "no">(initialValues?.payeeToSociete || "oui");
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: initialValues || {
      nomTraite: "",
      montantTotal: "",
      dateCreation: null,
      dateEcheance: null,
      lieuCreation: "",
      banque: "",
      rib: "",
      nomCedant: "",
      domiciliation: "",
      aval: "",
      adresseNomTire: "",
      payeeToSociete: "oui",
      nomPrenom: "",
      telephone: "",
      cin: "",
    }
  });

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      type: "traite",
      classification,
      payeeToSociete
    });
  };

  const handlePayeeChange = (value: "oui" | "no") => {
    setPayeeToSociete(value);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn("space-y-6", className)}>
      <h2 className="text-xl font-semibold">Paiement Traite</h2>
      


      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="nomTraite" className="font-medium italic">Nom Traite</Label>
          <Input 
            id="nomTraite"
            placeholder="Valeur"
            {...register("nomTraite", { required: "Nom traite est requis" })}
          />
          {errors.nomTraite && (
            <p className="text-sm text-red-500 mt-1">{errors.nomTraite.message as string}</p>
          )}
        </div>

        <div>
          <Label htmlFor="montantTotal" className="font-medium italic">Montant Total</Label>
          <Input 
            id="montantTotal"
            placeholder="Valeur"
            {...register("montantTotal", { required: "Montant total est requis" })}
          />
          {errors.montantTotal && (
            <p className="text-sm text-red-500 mt-1">{errors.montantTotal.message as string}</p>
          )}
        </div>

        <div>
          <Label htmlFor="dateCreation" className="font-medium italic">Date Création</Label>
          <DatePicker
            id="dateCreation"
            value={watch("dateCreation")}
            onChange={(date) => setValue("dateCreation", date)}
            placeholder="Choisir Date"
          />
        </div>

        <div>
          <Label htmlFor="dateEcheance" className="font-medium italic">Date échéance</Label>
          <DatePicker
            id="dateEcheance"
            value={watch("dateEcheance")}
            onChange={(date) => setValue("dateEcheance", date)}
            placeholder="Choisir Date"
          />
        </div>

        <div>
          <Label htmlFor="lieuCreation" className="font-medium italic">Lieu Création</Label>
          <Input 
            id="lieuCreation"
            placeholder="Valeur"
            {...register("lieuCreation")}
          />
        </div>

        <div>
          <Label htmlFor="banque" className="font-medium italic">Banque</Label>
          <Input 
            id="banque"
            placeholder="Valeur"
            {...register("banque")}
          />
        </div>

        <div>
          <Label htmlFor="rib" className="font-medium italic">RIB</Label>
          <Input 
            id="rib"
            placeholder="Valeur"
            {...register("rib")}
          />
        </div>

        <div>
          <Label htmlFor="nomCedant" className="font-medium italic">Nom de cédant</Label>
          <Input 
            id="nomCedant"
            placeholder="Valeur"
            {...register("nomCedant")}
          />
        </div>

        <div>
          <Label htmlFor="domiciliation" className="font-medium italic">Domiciliation</Label>
          <Input 
            id="domiciliation"
            placeholder="Valeur"
            {...register("domiciliation")}
          />
        </div>

        <div>
          <Label htmlFor="aval" className="font-medium italic">Aval</Label>
          <Input 
            id="aval"
            placeholder="Valeur"
            {...register("aval")}
          />
        </div>

        <div>
          <Label htmlFor="adresseNomTire" className="font-medium italic">Adresse et nom du tiré</Label>
          <Input 
            id="adresseNomTire"
            placeholder="Valeur"
            {...register("adresseNomTire")}
          />
        </div>

        <div>
          <Label className="font-medium italic">Payée à l'ordre de Société</Label>
          <RadioGroup 
            defaultValue={payeeToSociete} 
            onValueChange={(value) => handlePayeeChange(value as "oui" | "no")}
            className="flex items-center space-x-4 pt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="oui" id="payee-oui" />
              <Label htmlFor="payee-oui" className="cursor-pointer">Oui</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="payee-non" />
              <Label htmlFor="payee-non" className="cursor-pointer">Non</Label>
            </div>
          </RadioGroup>
        </div>

        {payeeToSociete === "no" && (
          <>
            <div>
              <Label htmlFor="nomPrenom" className="font-medium italic">Nom prénom</Label>
              <Input 
                id="nomPrenom"
                placeholder="Valeur"
                {...register("nomPrenom")}
              />
            </div>

            <div>
              <Label htmlFor="telephone" className="font-medium italic">Téléphone</Label>
              <Input 
                id="telephone"
                placeholder="Valeur"
                {...register("telephone")}
              />
            </div>

            <div>
              <Label htmlFor="cin" className="font-medium italic">CIN</Label>
              <Input 
                id="cin"
                placeholder="Valeur"
                {...register("cin")}
              />
            </div>
          </>
        )}
      </div>

      {/* Add More Button - for multiple traites */}
      <div className="flex justify-center">
        <Button type="button" variant="outline" size="sm" className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          <span>Ajouter une autre traite</span>
        </Button>
      </div>

      <Button type="submit" className="w-full">Sauvegarder</Button>
    </form>
  );
}
