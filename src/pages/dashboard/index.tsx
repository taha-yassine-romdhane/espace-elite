import React, { useState } from 'react';
import ClientTable from '@/components/tables/ClientTable';
import DiagnosticTable from '@/components/tables/DiagnosticTable';
import LocationTable from '@/components/tables/LocationTable';

// Sample data
const sampleClients = [
  {
    nom: 'Ahmed Ben Salem',
    numero: '12345678',
    medecin: 'Dr. Karim Mansouri',
    appareil: 'CPAP AirSense 11 AutoSet',
    accessoires: 'Masque nasal + Humidificateur',
    pieces: 'Filtres (x5)',
    paiement: '2.800.000 DT (Chèque)',
    montantRest: 700000,
    dateEcheance: '15/03/2024',
    coutRevient: 1800000,
    dateVente: '15/01/2024',
    technicien: 'Mohamed Kammoun'
  },
  // Add more sample clients as needed
];

const sampleDiagnostics = [
  {
    patient: 'Sami Maalej',
    telephone: '98234567',
    resultat: 'Normal' , // Ensure this is one of 'Normal', 'Anormal', or 'En attente'
    technicien: 'Amine Bouazizi',
    medecin: 'Dr. Karim Mansouri',
    dateInstallation: '01/02/2024',
    dateFin: '02/02/2024',
    remarque: 'Apnées sévères - AHI > 30/h',
    appareille: true
  },
  // Add more sample diagnostics as needed
];

const sampleLocations = [
  {
    patient: 'Fatma Benali',
    numero: '27834591',
    medecin: 'Dr. Nadia Hamdi',
    appareil: 'CPAP ResMed AirSense 11',
    joursLoues: 45,
    joursNonPayes: 15,
    dateInstallation: '15/12/2023',
    paiement: '150.000 DT (Mensuel)',
    montantRest: 150000,
    dateEcheance: '15/02/2024',
    coutRevient: 900000,
    technicien: 'Mohamed Kammoun'
  },
  // Add more sample locations as needed
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('location');

  const tabs = [
    { id: 'location', label: 'Location (3)' },
    { id: 'vente', label: 'Vente (3)' },
    { id: 'diagnostic', label: 'Diagnostic (3)' }
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Table Content */}
      <div className="bg-white shadow rounded-lg">
        {activeTab === 'location' && (
          <LocationTable locations={sampleLocations} />
        )}
        {activeTab === 'vente' && (
          <ClientTable clients={sampleClients} />
        )}
        {activeTab === 'diagnostic' && (
          <DiagnosticTable diagnostics={sampleDiagnostics} />
        )}
      </div>
    </div>
  );
}