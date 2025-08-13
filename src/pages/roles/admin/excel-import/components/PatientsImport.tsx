import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import {
  Users,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  ArrowLeft,
  Eye,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import FieldMapper from './FieldMapper';

interface PatientField {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'phone';
  description?: string;
  example?: string;
}

const patientFields: PatientField[] = [
  { 
    key: 'firstName', 
    label: 'Prénom', 
    required: true, 
    type: 'string',
    description: 'Prénom du patient',
    example: 'Jean'
  },
  { 
    key: 'lastName', 
    label: 'Nom', 
    required: true, 
    type: 'string',
    description: 'Nom de famille du patient',
    example: 'Dupont'
  },
  { 
    key: 'telephone', 
    label: 'Téléphone', 
    required: true, 
    type: 'phone',
    description: 'Numéro de téléphone principal',
    example: '+216 98 765 432'
  },
  { 
    key: 'telephoneTwo', 
    label: 'Téléphone secondaire', 
    required: false, 
    type: 'phone',
    description: 'Numéro de téléphone secondaire',
    example: '+216 20 123 456'
  },
  { 
    key: 'dateOfBirth', 
    label: 'Date de naissance', 
    required: false, 
    type: 'date',
    description: 'Date de naissance du patient',
    example: '01/01/1980'
  },
  { 
    key: 'cin', 
    label: 'CIN', 
    required: false, 
    type: 'string',
    description: 'Carte d\'identité nationale',
    example: '12345678'
  },
  { 
    key: 'cnamId', 
    label: 'ID CNAM', 
    required: false, 
    type: 'string',
    description: 'Identifiant CNAM',
    example: 'CNAM123456'
  },
  { 
    key: 'generalNote', 
    label: 'Note générale', 
    required: false, 
    type: 'string',
    description: 'Notes ou remarques générales'
  },
  { 
    key: 'governorate', 
    label: 'Gouvernorat', 
    required: false, 
    type: 'string',
    description: 'Gouvernorat de résidence',
    example: 'Tunis'
  },
  { 
    key: 'delegation', 
    label: 'Délégation', 
    required: false, 
    type: 'string',
    description: 'Délégation de résidence',
    example: 'Carthage'
  },
  { 
    key: 'detailedAddress', 
    label: 'Adresse détaillée', 
    required: false, 
    type: 'string',
    description: 'Adresse complète',
    example: '123 Rue de la République'
  },
  { 
    key: 'weight', 
    label: 'Poids (kg)', 
    required: false, 
    type: 'number',
    description: 'Poids en kilogrammes',
    example: '75'
  },
  { 
    key: 'height', 
    label: 'Taille (cm)', 
    required: false, 
    type: 'number',
    description: 'Taille en centimètres',
    example: '175'
  },
  { 
    key: 'medicalHistory', 
    label: 'Antécédents médicaux', 
    required: false, 
    type: 'string',
    description: 'Historique médical du patient'
  },
  { 
    key: 'antecedant', 
    label: 'Antécédents', 
    required: false, 
    type: 'string',
    description: 'Autres antécédents'
  }
];

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  duplicates: Array<{ row: number; phone: string }>;
}

export default function PatientsImport() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [mappedData, setMappedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier Excel (.xlsx ou .xls)",
        variant: "destructive",
      });
      return;
    }

    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error("Le fichier Excel est vide ou ne contient pas de données");
      }

      // Extract and clean headers
      const rawHeaders = jsonData[0] as any[];
      const headers = rawHeaders
        .map((header, index) => {
          if (header === null || header === undefined || header === '') {
            return `Column ${index + 1}`;
          }
          return String(header).trim();
        })
        .filter((header, index) => {
          // Check if there's any data in this column
          return jsonData.slice(1).some(row => {
            const cell = (row as any[])[index];
            return cell !== null && cell !== undefined && cell !== '';
          });
        });

      // Filter rows with at least some data
      const rows = jsonData.slice(1).filter(row => 
        (row as any[]).some(cell => cell !== null && cell !== undefined && cell !== '')
      );

      if (headers.length === 0) {
        throw new Error("Aucune colonne valide trouvée dans le fichier");
      }

      if (rows.length === 0) {
        throw new Error("Aucune donnée trouvée dans le fichier");
      }

      setExcelHeaders(headers);
      setExcelData(rows);
      setStep('mapping');
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire le fichier Excel",
        variant: "destructive",
      });
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingComplete = (mapping: Record<string, string>) => {
    setFieldMapping(mapping);
    
    // Extract split columns configuration
    const splitColumns = mapping['_splitColumns'] ? JSON.parse(mapping['_splitColumns']) : {};
    
    // Transform data based on mapping
    const transformed = excelData.map((row, index) => {
      const patient: any = { _rowIndex: index + 2 }; // +2 because Excel rows start at 1 and we skip header
      
      Object.entries(mapping).forEach(([fieldKey, excelColumn]) => {
        if (fieldKey === '_splitColumns') return;
        
        if (excelColumn.includes('[split]')) {
          // Handle split columns
          const originalColumn = excelColumn.replace('[split]', '');
          const splitConfig = splitColumns[originalColumn];
          
          if (splitConfig) {
            const columnIndex = excelHeaders.indexOf(originalColumn);
            if (columnIndex !== -1) {
              const fullValue = row[columnIndex]?.toString().trim() || '';
              const words = fullValue.split(/\s+/).filter(word => word.length > 0);
              
              if (fieldKey === 'firstName') {
                // First name is the first word
                patient[fieldKey] = words[0] || '';
              } else if (fieldKey === 'lastName') {
                // Last name is everything after the first word
                patient[fieldKey] = words.slice(1).join(' ') || '';
              }
            }
          }
        } else {
          // Handle regular mapping
          const columnIndex = excelHeaders.indexOf(excelColumn);
          if (columnIndex !== -1) {
            patient[fieldKey] = row[columnIndex];
          }
        }
      });
      
      return patient;
    });
    
    setMappedData(transformed);
    setStep('preview');
  };

  const handleImport = async () => {
    setStep('importing');
    setIsProcessing(true);
    setImportProgress(0);

    const batchSize = 50;
    const totalBatches = Math.ceil(mappedData.length / batchSize);
    let processedCount = 0;
    
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      duplicates: []
    };

    try {
      for (let i = 0; i < totalBatches; i++) {
        const batch = mappedData.slice(i * batchSize, (i + 1) * batchSize);
        
        const response = await fetch('/api/renseignements/patients/import-advanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            patients: batch,
            mapping: fieldMapping 
          })
        });

        const batchResult = await response.json();
        
        if (batchResult.results) {
          result.success += batchResult.results.success || 0;
          result.failed += batchResult.results.failed || 0;
          
          if (batchResult.results.errors) {
            result.errors.push(...batchResult.results.errors);
          }
          
          if (batchResult.results.duplicates) {
            result.duplicates.push(...batchResult.results.duplicates);
          }
        }

        processedCount += batch.length;
        setImportProgress((processedCount / mappedData.length) * 100);
      }

      setImportResult(result);
      setStep('complete');
      
      toast({
        title: "Import terminé",
        description: `${result.success} patients importés avec succès`,
        variant: result.failed > 0 ? "destructive" : "default"
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erreur d'import",
        description: "Une erreur est survenue lors de l'import",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/renseignements/patients/template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_patients_import.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le template",
        variant: "destructive"
      });
    }
  };

  const resetImport = () => {
    setStep('upload');
    setFile(null);
    setExcelData([]);
    setExcelHeaders([]);
    setFieldMapping({});
    setMappedData([]);
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" />
            <CardTitle>Import de Patients</CardTitle>
          </div>
          {step !== 'upload' && step !== 'complete' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (step === 'mapping') setStep('upload');
                else if (step === 'preview') setStep('mapping');
                else if (step === 'importing') return;
              }}
              disabled={isProcessing}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Sélectionnez votre fichier Excel
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Formats acceptés: .xlsx, .xls
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choisir un fichier
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le template
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Conseil:</strong> Téléchargez le template pour voir le format attendu.
                Votre fichier Excel peut avoir des colonnes différentes - vous pourrez les mapper
                à l'étape suivante.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Mapping Step */}
        {step === 'mapping' && (
          <FieldMapper
            excelHeaders={excelHeaders}
            excelData={excelData}
            targetFields={patientFields}
            onMappingComplete={handleMappingComplete}
            onCancel={resetImport}
            entityName="patients"
          />
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Aperçu des données</h3>
              <p className="text-sm text-gray-600">
                {mappedData.length} patients prêts à être importés
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ligne
                      </th>
                      {Object.entries(fieldMapping).map(([fieldKey]) => {
                        const field = patientFields.find(f => f.key === fieldKey);
                        return (
                          <th key={fieldKey} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {field?.label || fieldKey}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mappedData.slice(0, 10).map((patient, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {patient._rowIndex}
                        </td>
                        {Object.keys(fieldMapping).map(fieldKey => (
                          <td key={fieldKey} className="px-4 py-3 text-sm text-gray-900">
                            {patient[fieldKey] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mappedData.length > 10 && (
                <div className="bg-gray-50 px-4 py-3 text-center text-sm text-gray-600">
                  ... et {mappedData.length - 10} autres lignes
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Modifier le mapping
              </Button>
              <Button onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Lancer l'import
              </Button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="space-y-6 py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-medium mb-2">Import en cours...</h3>
              <p className="text-sm text-gray-600">
                Veuillez patienter pendant l'import des patients
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <Progress value={importProgress} className="h-2" />
              <p className="text-center text-sm text-gray-600 mt-2">
                {Math.round(importProgress)}% complété
              </p>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && importResult && (
          <div className="space-y-6">
            <div className="text-center py-8">
              {importResult.failed === 0 ? (
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
              ) : (
                <AlertCircle className="h-16 w-16 mx-auto text-yellow-600 mb-4" />
              )}
              
              <h3 className="text-xl font-medium mb-2">Import terminé</h3>
              <div className="space-y-2">
                <p className="text-green-600">
                  <strong>{importResult.success}</strong> patients importés avec succès
                </p>
                {importResult.failed > 0 && (
                  <p className="text-red-600">
                    <strong>{importResult.failed}</strong> imports échoués
                  </p>
                )}
                {importResult.duplicates.length > 0 && (
                  <p className="text-yellow-600">
                    <strong>{importResult.duplicates.length}</strong> doublons détectés
                  </p>
                )}
              </div>
            </div>

            {(importResult.errors.length > 0 || importResult.duplicates.length > 0) && (
              <div className="space-y-4">
                {importResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">Erreurs d'import:</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          Ligne {error.row}: {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {importResult.duplicates.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-600 mb-2">Doublons détectés:</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                      {importResult.duplicates.map((dup, index) => (
                        <div key={index} className="text-sm text-yellow-700 mb-1">
                          Ligne {dup.row}: Téléphone {dup.phone} déjà existant
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" onClick={resetImport}>
                <Upload className="h-4 w-4 mr-2" />
                Nouvel import
              </Button>
              <Button onClick={() => window.location.href = '/roles/admin/renseignement'}>
                <Eye className="h-4 w-4 mr-2" />
                Voir les patients
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}