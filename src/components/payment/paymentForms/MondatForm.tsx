import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

interface MondatFormProps {
  onSubmit: (data: any) => void;
  initialValues?: any;
  className?: string;
}

export default function MondatForm({ onSubmit, initialValues, className }: MondatFormProps) {
  const [classification, setClassification] = useState<"principal" | "garantie" | "complement">("principal");
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: initialValues || {
      montantTotal: "",
      acompte: "",
      reste: "",
      dateReste: null,
      benificiere: "",
      bureauEmission: "",
      dateEmission: null,
    }
  });

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      type: "mondat",
      classification
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn("space-y-6", className)}>
      <h2 className="text-xl font-semibold">Paiement Par Mondât</h2>
      
 

      {/* Form Fields */}
      <div className="space-y-4">
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
          <Label htmlFor="acompte" className="font-medium italic">Acompte</Label>
          <Input 
            id="acompte"
            placeholder="Valeur"
            {...register("acompte")}
          />
        </div>

        <div>
          <Label htmlFor="reste" className="font-medium italic">Reste</Label>
          <Input 
            id="reste"
            placeholder="Valeur"
            {...register("reste")}
          />
        </div>

        <div>
          <Label htmlFor="dateReste" className="font-medium italic">Date Reste</Label>
          <DatePicker
            id="dateReste"
            value={watch("dateReste")}
            onChange={(date) => setValue("dateReste", date)}
            placeholder="Choisir Date"
          />
        </div>

        <div>
          <Label htmlFor="benificiere" className="font-medium italic">Bénificiére</Label>
          <Input 
            id="benificiere"
            placeholder="Valeur"
            {...register("benificiere", { required: "Bénificiére est requis" })}
          />
          {errors.benificiere && (
            <p className="text-sm text-red-500 mt-1">{errors.benificiere.message as string}</p>
          )}
        </div>

        <div>
          <Label htmlFor="bureauEmission" className="font-medium italic">Bureau d'émission</Label>
          <Input 
            id="bureauEmission"
            placeholder="Valeur"
            {...register("bureauEmission", { required: "Bureau d'émission est requis" })}
          />
          {errors.bureauEmission && (
            <p className="text-sm text-red-500 mt-1">{errors.bureauEmission.message as string}</p>
          )}
        </div>

        <div>
          <Label htmlFor="dateEmission" className="font-medium italic">Date d'émission</Label>
          <DatePicker
            id="dateEmission"
            value={watch("dateEmission")}
            onChange={(date) => setValue("dateEmission", date)}
            placeholder="Choisir Date"
          />
        </div>
      </div>

      <Button type="submit" className="w-full">Sauvegarder</Button>
    </form>
  );
}
