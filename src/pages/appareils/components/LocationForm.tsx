import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { User } from "@prisma/client";

interface LocationFormProps {
  onSuccess?: () => void;
}

export function LocationForm({ onSuccess }: LocationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    userId: "",
  });

  // Fetch users
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      return data.filter((user: User) => user.isActive);
    },
  });

  const sortedUsers = users?.sort((a: any, b: any) => {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  }) || [];

  const addLocationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/stock-locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to add location");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-locations"] });
      setFormData({ name: "", description: "", userId: "" });
      toast({
        title: "Succès",
        description: "L'emplacement a été ajouté avec succès",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'emplacement",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label htmlFor="name">Nom</label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="description">Description</label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="userId">Responsable</label>
        <Select
          value={formData.userId}
          onValueChange={(value) => setFormData({ ...formData, userId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un responsable" />
          </SelectTrigger>
          <SelectContent>
            {sortedUsers.map((user : User) => (
              <SelectItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full"
        onClick={() => addLocationMutation.mutate(formData)}
        disabled={!formData.name}
      >
        Ajouter
      </Button>
    </div>
  );
}
