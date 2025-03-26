import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  Database, 
  Download, 
  Upload, 
  Calendar, 
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BackupItem {
  id: string;
  filename: string;
  size: string;
  date: string;
  type: "auto" | "manual";
}

export function BackupRestore() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);

  // Sample backup history
  const backupHistory: BackupItem[] = [
    {
      id: "1",
      filename: "backup_2025-03-09_auto.sql",
      size: "4.2 MB",
      date: "09/03/2025 08:00",
      type: "auto"
    },
    {
      id: "2",
      filename: "backup_2025-03-08_auto.sql",
      size: "4.1 MB",
      date: "08/03/2025 08:00",
      type: "auto"
    },
    {
      id: "3",
      filename: "backup_2025-03-07_manual.sql",
      size: "4.0 MB",
      date: "07/03/2025 14:32",
      type: "manual"
    },
    {
      id: "4",
      filename: "backup_2025-03-06_auto.sql",
      size: "3.9 MB",
      date: "06/03/2025 08:00",
      type: "auto"
    },
  ];

  // Handle export database
  const handleExportDatabase = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          
          // Show success toast
          toast({
            title: "Sauvegarde terminée",
            description: "La base de données a été exportée avec succès",
          });
          
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    try {
      // In a real implementation, this would call an API endpoint
      // await fetch("/api/settings/backup", { method: "POST" });
    } catch (error) {
      clearInterval(interval);
      setIsExporting(false);
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'exportation de la base de données",
        variant: "destructive",
      });
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle import database
  const handleImportDatabase = async () => {
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier à importer",
        variant: "destructive",
      });
      return;
    }
    
    setIsImporting(true);
    setImportProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          setSelectedFile(null);
          
          // Reset file input
          const fileInput = document.getElementById("import-file") as HTMLInputElement;
          if (fileInput) fileInput.value = "";
          
          // Show success toast
          toast({
            title: "Importation terminée",
            description: "La base de données a été importée avec succès",
          });
          
          return 100;
        }
        return prev + 5;
      });
    }, 200);
    
    try {
      // In a real implementation, this would upload the file to an API endpoint
      // const formData = new FormData();
      // formData.append("file", selectedFile);
      // await fetch("/api/settings/restore", {
      //   method: "POST",
      //   body: formData,
      // });
    } catch (error) {
      clearInterval(interval);
      setIsImporting(false);
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'importation de la base de données",
        variant: "destructive",
      });
    }
  };

  // Handle restore from backup
  const handleRestoreFromBackup = async () => {
    if (!selectedBackup) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          setIsRestoreDialogOpen(false);
          
          // Show success toast
          toast({
            title: "Restauration terminée",
            description: `La base de données a été restaurée avec succès à partir de la sauvegarde du ${selectedBackup.date}`,
          });
          
          return 100;
        }
        return prev + 5;
      });
    }, 200);
    
    try {
      // In a real implementation, this would call an API endpoint
      // await fetch(`/api/settings/restore/${selectedBackup.id}`, { method: "POST" });
    } catch (error) {
      clearInterval(interval);
      setIsImporting(false);
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la restauration de la base de données",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Sauvegarde et Restauration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Sauvegarde automatique</h3>
              <p className="text-blue-700 text-sm">
                Le système effectue une sauvegarde automatique quotidienne de la base de données à 08:00. 
                Les 30 dernières sauvegardes sont conservées.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sauvegarde manuelle</h3>
            <p className="text-gray-500">
              Créez une sauvegarde complète de la base de données à tout moment.
            </p>
            
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleExportDatabase} 
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Sauvegarde en cours..." : "Créer une sauvegarde"}
              </Button>
              
              {isExporting && (
                <div className="flex-1">
                  <Progress value={exportProgress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">{exportProgress}% terminé</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Restauration</h3>
            <p className="text-gray-500">
              Restaurez la base de données à partir d'un fichier de sauvegarde.
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4 space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Importer un fichier
                  </h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="import-file">Fichier de sauvegarde</Label>
                    <Input 
                      id="import-file" 
                      type="file" 
                      accept=".sql,.dump" 
                      onChange={handleFileChange}
                      disabled={isImporting}
                    />
                    <p className="text-xs text-gray-500">
                      Formats acceptés: .sql, .dump
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleImportDatabase} 
                    disabled={!selectedFile || isImporting}
                    className="w-full"
                  >
                    {isImporting ? "Importation en cours..." : "Importer et restaurer"}
                  </Button>
                  
                  {isImporting && (
                    <div>
                      <Progress value={importProgress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">{importProgress}% terminé</p>
                    </div>
                  )}
                </div>
                
                <div className="border rounded-md p-4 space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Restaurer depuis l'historique
                  </h4>
                  
                  <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Voir l'historique des sauvegardes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Historique des sauvegardes</DialogTitle>
                      </DialogHeader>
                      
                      <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4">Date</th>
                              <th className="text-left py-2 px-4">Nom du fichier</th>
                              <th className="text-left py-2 px-4">Taille</th>
                              <th className="text-left py-2 px-4">Type</th>
                              <th className="text-right py-2 px-4">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {backupHistory.map((backup) => (
                              <tr 
                                key={backup.id} 
                                className="border-b hover:bg-gray-50 cursor-pointer"
                                onClick={() => setSelectedBackup(backup)}
                              >
                                <td className="py-2 px-4">{backup.date}</td>
                                <td className="py-2 px-4">{backup.filename}</td>
                                <td className="py-2 px-4">{backup.size}</td>
                                <td className="py-2 px-4">
                                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                    backup.type === "auto" 
                                      ? "bg-blue-100 text-blue-800" 
                                      : "bg-purple-100 text-purple-800"
                                  }`}>
                                    {backup.type === "auto" ? "Automatique" : "Manuelle"}
                                  </span>
                                </td>
                                <td className="py-2 px-4 text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBackup(backup);
                                    }}
                                    className={selectedBackup?.id === backup.id ? "bg-blue-100" : ""}
                                  >
                                    {selectedBackup?.id === backup.id ? (
                                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      "Sélectionner"
                                    )}
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <DialogFooter className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {selectedBackup ? (
                            <span>Sauvegarde sélectionnée: <strong>{selectedBackup.date}</strong></span>
                          ) : (
                            <span>Aucune sauvegarde sélectionnée</span>
                          )}
                        </div>
                        <Button 
                          onClick={handleRestoreFromBackup} 
                          disabled={!selectedBackup || isImporting}
                        >
                          Restaurer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <div className="text-sm text-gray-500">
                    Restaurez la base de données à partir d'une sauvegarde précédente.
                  </div>
                </div>
              </div>
              
              {isImporting && !isRestoreDialogOpen && (
                <div>
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">{importProgress}% terminé</p>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-amber-50 p-4 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">Attention</h3>
              <p className="text-amber-700 text-sm">
                La restauration de la base de données remplacera toutes les données actuelles. 
                Cette opération est irréversible. Assurez-vous de créer une sauvegarde avant de procéder.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}