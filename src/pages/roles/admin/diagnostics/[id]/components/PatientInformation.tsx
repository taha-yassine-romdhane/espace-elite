import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { User, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PatientInformationProps {
  patient: any;
}

export function PatientInformation({ patient }: PatientInformationProps) {
  if (!patient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Information du Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500 italic">Information patient non disponible</div>
        </CardContent>
      </Card>
    );
  }

  // Format date of birth
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "PPP", { locale: fr });
  };

  // Calculate age
  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return `${age} ans`;
  };

  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b border-gray-100">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Information du Patient
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h3>
            {patient.dateOfBirth && (
              <div className="flex items-center gap-1 text-gray-600 mt-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(patient.dateOfBirth)} ({calculateAge(patient.dateOfBirth)})</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {patient.telephone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Téléphone</div>
                  <div className="font-medium">{patient.telephone}</div>
                </div>
              </div>
            )}
            
            {patient.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium break-all">{patient.email}</div>
                </div>
              </div>
            )}
            
            {patient.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Adresse</div>
                  <div className="font-medium">{patient.address}</div>
                </div>
              </div>
            )}
          </div>

          {patient.medicalInfo && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="font-medium text-gray-900 mb-2">Informations médicales</h4>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{patient.medicalInfo}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
