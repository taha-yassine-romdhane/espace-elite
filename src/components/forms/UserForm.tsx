import React from 'react';
import { Button } from "@/components/ui/button";
import { Role } from '@prisma/client';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface FormData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  telephone?: string;
  role: Role;
  isActive: boolean;
  address?: string;
  speciality?: string;
}

interface UserFormProps {
  formData: FormData;
  isEditMode?: boolean;
  onChange: (name: string, value: string | boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
  formData,
  isEditMode = false,
  onChange,
  onSubmit,
  onCancel
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.name, e.target.value);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-blue-900">Prénom</Label>
            <Input
              id="firstName"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Prénom"
              className="border-blue-100 focus:border-blue-200 focus:ring-blue-200"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-blue-900">Nom</Label>
            <Input
              id="lastName"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Nom"
              className="border-blue-100 focus:border-blue-200 focus:ring-blue-200"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-blue-900">Email</Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="email@example.com"
            className="border-blue-100 focus:border-blue-200 focus:ring-blue-200"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-blue-900">
            {isEditMode ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
          </Label>
          <Input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            className="border-blue-100 focus:border-blue-200 focus:ring-blue-200"
            required={!isEditMode}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telephone" className="text-blue-900">Téléphone</Label>
          <Input
            id="telephone"
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={handleInputChange}
            placeholder="+216 XX XXX XXX"
            className="border-blue-100 focus:border-blue-200 focus:ring-blue-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role" className="text-blue-900">Rôle</Label>
          <Select 
            name="role" 
            value={formData.role} 
            onValueChange={(value) => onChange('role', value)}
          >
            <SelectTrigger className="border-blue-100 focus:border-blue-200 focus:ring-blue-200">
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Administrateur</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="DOCTOR">Médecin</SelectItem>
              <SelectItem value="EMPLOYEE">Employé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Additional fields for Doctor role */}
        {formData.role === 'DOCTOR' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="speciality" className="text-blue-900">Spécialité</Label>
              <Input
                id="speciality"
                type="text"
                name="speciality"
                value={formData.speciality || ''}
                onChange={handleInputChange}
                placeholder="Cardiologie, Neurologie, etc."
                className="border-blue-100 focus:border-blue-200 focus:ring-blue-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-blue-900">Adresse</Label>
              <Input
                id="address"
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                placeholder="Adresse complète"
                className="border-blue-100 focus:border-blue-200 focus:ring-blue-200"
              />
            </div>
          </>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => onChange('isActive', checked)}
            className="data-[state=checked]:bg-blue-600"
          />
          <Label htmlFor="isActive" className="text-blue-900">Utilisateur actif</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          onClick={onSubmit}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isEditMode ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </Card>
  );
};

export default UserForm;
