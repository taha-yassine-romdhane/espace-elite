import { useState } from 'react';
import { TechnicianSelector } from './components/TechnicianSelector';
import { TechnicianHistory } from './components/TechnicianHistory';

export default function TechnicianSpacePage() {
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);

  const handleBack = () => {
    setSelectedTechnicianId(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-blue-900">Espace Technicien</h1>
        
        {!selectedTechnicianId ? (
          <div className="mt-6">
            <TechnicianSelector onSelect={setSelectedTechnicianId} />
          </div>
        ) : (
          <TechnicianHistory technicianId={selectedTechnicianId} onBack={handleBack} />
        )}
      </div>
    </div>
  );
}
