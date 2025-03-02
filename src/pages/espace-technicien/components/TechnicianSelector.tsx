import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface TechnicianSelectorProps {
  onSelect: (technicianId: string) => void;
}

export function TechnicianSelector({ onSelect }: TechnicianSelectorProps) {
  const [selectedValue, setSelectedValue] = useState<string>("");

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sélectionner Technicien</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedValue}
          onValueChange={setSelectedValue}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tech1">Dr. Rossignol</SelectItem>
            <SelectItem value="tech2">Marie Martin</SelectItem>
            <SelectItem value="tech3">Jean Dupont</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          className="w-full" 
          onClick={() => onSelect(selectedValue)}
          disabled={!selectedValue}
        >
          Entrer
        </Button>
      </CardContent>
    </Card>
  );
}
