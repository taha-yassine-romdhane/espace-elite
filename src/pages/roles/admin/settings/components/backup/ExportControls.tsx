import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/Card";
import { Download, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type BackupFormat = 'json' | 'sql' | 'xml' | 'csv' | 'xlsx';

interface ExportControlsProps {
  onCreateBackup: (format: BackupFormat, download: boolean) => Promise<void>;
  isExporting: boolean;
  exportProgress: number;
}

export function ExportControls({ onCreateBackup, isExporting, exportProgress }: ExportControlsProps) {
  const [selectedFormat, setSelectedFormat] = useState<BackupFormat>('json');
  const [downloadAfterCreation, setDownloadAfterCreation] = useState(true);
  
  const handleCreateBackup = () => {
    onCreateBackup(selectedFormat, downloadAfterCreation);
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium">Sauvegarde manuelle</h3>
            <p className="text-sm text-gray-500">
              Créez une sauvegarde complète de la base de données à tout moment.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Select 
                  value={selectedFormat} 
                  onValueChange={(value) => setSelectedFormat(value as BackupFormat)}
                  disabled={isExporting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Format de sauvegarde</SelectLabel>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="sql">SQL</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="download" 
                  checked={downloadAfterCreation} 
                  onCheckedChange={() => setDownloadAfterCreation(!downloadAfterCreation)}
                  disabled={isExporting}
                />
                <Label htmlFor="download" className="text-sm">Télécharger après création</Label>
              </div>
            </div>
            
            <Button 
              onClick={handleCreateBackup}
              disabled={isExporting}
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Créer une sauvegarde
            </Button>
            
            {isExporting && (
              <div className="w-full md:w-[200px]">
                <Progress value={exportProgress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1 text-center">{exportProgress}% terminé</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
