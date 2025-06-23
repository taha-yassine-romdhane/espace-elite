import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, CheckCircle2, Download } from "lucide-react";
import { BackupItem } from "../types/backup";
import { formatFileSize } from "@/lib/utils";

interface BackupHistoryModalProps {
  open: boolean;
  onClose: () => void;
  backups: BackupItem[];
  isLoading: boolean;
  onRestore: (backup: BackupItem) => Promise<void>;
  onDelete: (backup: BackupItem) => Promise<void>;
  isDeleting: boolean;
}

export function BackupHistoryModal({
  open,
  onClose,
  backups,
  isLoading,
  onRestore,
  onDelete,
  isDeleting
}: BackupHistoryModalProps) {
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique des sauvegardes</DialogTitle>
          <DialogDescription>
            Sélectionnez une sauvegarde pour la restaurer ou la supprimer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Nom</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Taille</th>
                <th className="text-left p-2">Format</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Chargement des sauvegardes...</span>
                    </div>
                  </td>
                </tr>
              ) : backups && backups.length > 0 ? (
                backups.map((backup: BackupItem) => {
                  const createdDate = new Date(backup.createdAt).toLocaleString();
                  
                  return (
                    <tr 
                      key={backup.id} 
                      className={`border-b hover:bg-gray-50 cursor-pointer ${
                        selectedBackup?.id === backup.id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => setSelectedBackup(backup)}
                    >
                      <td className="p-2">{backup.fileName}</td>
                      <td className="p-2">{createdDate}</td>
                      <td className="p-2">{typeof backup.fileSize === 'number' ? formatFileSize(backup.fileSize) : 'Taille inconnue'}</td>
                      <td className="p-2">{backup.format || "SQL"}</td>
                      <td className="p-2 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBackup(backup);
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Sélectionner
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Create download URL
                            const downloadUrl = `/api/settings/backup?id=${backup.id}&download=true`;
                            // Open in new tab to trigger download
                            window.open(downloadUrl, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Télécharger
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(backup);
                          }}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    Aucune sauvegarde disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <DialogFooter className="mt-4">
          <Button 
            onClick={() => onClose()} 
            variant="outline"
          >
            Annuler
          </Button>
          <Button 
            onClick={() => selectedBackup && onRestore(selectedBackup)}
            disabled={!selectedBackup || isDeleting}
          >
            Restaurer la sauvegarde sélectionnée
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
