import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { History, User, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DiagnosticHistoryProps {
  history: any[];
  patientHistory: any[];
}

export function DiagnosticHistory({ history, patientHistory }: DiagnosticHistoryProps) {
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "PPP à HH:mm", { locale: fr });
  };

  // Combine and sort all history items by date
  const allHistory = [
    ...(history || []).map(item => ({
      ...item,
      type: 'diagnostic',
      date: item.createdAt || item.date,
    })),
    ...(patientHistory || []).map(item => ({
      ...item,
      type: 'patient',
      date: item.createdAt || item.date,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (allHistory.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-gray-50 border-b border-gray-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            Historique
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-gray-500 italic">Aucun historique disponible</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b border-gray-100">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" />
          Historique
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {allHistory.map((item, index) => (
            <div key={index} className="relative pl-6 pb-6">
              {/* Timeline connector */}
              {index < allHistory.length - 1 && (
                <div className="absolute top-6 bottom-0 left-[10px] w-0.5 bg-gray-200"></div>
              )}
              
              {/* Timeline dot */}
              <div className="absolute top-1 left-0 w-5 h-5 rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center">
                {item.type === 'diagnostic' ? (
                  <FileText className="h-2.5 w-2.5 text-blue-600" />
                ) : (
                  <User className="h-2.5 w-2.5 text-blue-600" />
                )}
              </div>
              
              {/* Content */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">{formatDate(item.date)}</span>
                </div>
                
                <h4 className="font-medium text-gray-900">
                  {item.type === 'diagnostic' ? (
                    item.action || "Mise à jour du diagnostic"
                  ) : (
                    item.type === 'patient' ? (
                      item.action || "Mise à jour du patient"
                    ) : (
                      "Action inconnue"
                    )
                  )}
                </h4>
                
                {item.description && (
                  <p className="text-gray-700 mt-1">{item.description}</p>
                )}
                
                {item.changes && (
                  <div className="mt-2 text-sm">
                    <h5 className="font-medium text-gray-700 mb-1">Modifications:</h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {Object.entries(item.changes).map(([key, value]: [string, any]) => (
                        <li key={key}>
                          <span className="font-medium">{key}:</span> {value.from} → {value.to}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {item.performedBy && (
                  <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                    <User className="h-3.5 w-3.5" />
                    <span>Par: {item.performedBy.firstName && item.performedBy.lastName ? `${item.performedBy.firstName} ${item.performedBy.lastName}` : "Utilisateur inconnu"}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default DiagnosticHistory;
