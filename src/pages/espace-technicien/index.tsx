import { useState } from 'react';
import { TechnicianSelector } from './components/TechnicianSelector';
import { TechnicianHistory } from './components/TechnicianHistory';

export default function TechnicianSpacePage() {
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Espace Technicien</h1>
      
      {!selectedTechnicianId ? (
        <TechnicianSelector onSelect={setSelectedTechnicianId} />
      ) : (
        <TechnicianHistory technicianId={selectedTechnicianId} />
      )}
    </div>
  );
}
