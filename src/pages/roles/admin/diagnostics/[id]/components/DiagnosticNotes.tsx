import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FileText } from "lucide-react";

interface DiagnosticNotesProps {
  notes: string | null;
}

export function DiagnosticNotes({ notes }: DiagnosticNotesProps) {
  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b border-gray-100">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Notes du Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {notes ? (
          <div className="whitespace-pre-wrap text-gray-700">{notes}</div>
        ) : (
          <div className="text-gray-500 italic">Aucune note disponible pour ce diagnostic</div>
        )}
      </CardContent>
    </Card>
  );
}

export default DiagnosticNotes;
