import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Users, Stethoscope, Package, Download, Search, Calendar, TrendingUp, PieChart } from "lucide-react";
import { ExcelTable } from '@/components/analytics/ExcelTable';
import AdminLayout from '../AdminLayout';
import * as XLSX from 'xlsx';
import { NextPageWithLayout } from '@/pages/_app';

interface DetailedAnalytics {
  employees: any[];
  patients: any[];
  devices: any[];
  summary: {
    employees: any;
    patients: any;
    devices: any;
  };
}

const AnalyticsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<DetailedAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('employees');

  // Search states for each tab
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [deviceSearch, setDeviceSearch] = useState('');

  // Date range filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics/detailed');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const formatCurrency = (value: any) => {
    if (value === 'N/A' || value === null || value === undefined) return 'N/A';
    return `${Number(value).toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`;
  };

  const formatNumber = (value: any) => {
    if (value === 'N/A' || value === null || value === undefined) return 'N/A';
    return Number(value).toLocaleString('fr-TN');
  };

  // Enum translation function - converts raw enum values to French
  const formatEnum = (value: string | null | undefined): string => {
    if (!value) return '-';

    const translations: Record<string, string> = {
      // Device Status
      'ACTIVE': 'Actif',
      'AVAILABLE': 'Disponible',
      'RENTED': 'En location',
      'SOLD': 'Vendu',
      'MAINTENANCE': 'En maintenance',
      'RESERVED': 'Réservé',
      'OUT_OF_SERVICE': 'Hors service',
      'PENDING': 'En attente',

      // Device Destination
      'RENTAL': 'Location',
      'SALE': 'Vente',
      'RENTAL_OR_SALE': 'Location ou Vente',

      // Employee Roles
      'ADMIN': 'Administrateur',
      'EMPLOYEE': 'Employé',
      'TECHNICIEN': 'Technicien',
      'SUPERVISEUR': 'Superviseur',
      'MANAGER': 'Manager',

      // Patient Affiliation
      'CNAM': 'CNAM',
      'ASSURE_SOCIAL': 'Assuré Social',
      'PRIVE': 'Privé',
      'MEDICAL_DEVICE': 'Appareil Médical',
      'NON_ASSURE': 'Non Assuré',

      // Beneficiary Types
      'PRINCIPAL': 'Principal',
      'CONJOINT': 'Conjoint',
      'ENFANT': 'Enfant',
      'PARENT': 'Parent',
      'AUTRE': 'Autre',

      // Payment Status
      'PAID': 'Payé',
      'UNPAID': 'Non payé',
      'PARTIAL': 'Partiel',
      'OVERDUE': 'En retard',

      // Appointment/Diagnostic Status
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé',
      'SCHEDULED': 'Planifié',
      'IN_PROGRESS': 'En cours',
      'CONFIRMED': 'Confirmé',

      // Device Types
      'CONCENTRATOR': 'Concentrateur',
      'CPAP': 'CPAP',
      'BIPAP': 'BiPAP',
      'VENTILATOR': 'Ventilateur',
      'OXYGEN_CYLINDER': 'Bouteille O2',
      'NEBULIZER': 'Nébuliseur',
      'SUCTION': 'Aspirateur',
      'HOSPITAL_BED': 'Lit médicalisé',
      'WHEELCHAIR': 'Fauteuil roulant',
      'WALKER': 'Déambulateur',
      'MATTRESS': 'Matelas',
      'OTHER': 'Autre',

      // Gender
      'MALE': 'Homme',
      'FEMALE': 'Femme',

      // Yes/No
      'YES': 'Oui',
      'NO': 'Non',
      'TRUE': 'Oui',
      'FALSE': 'Non'
    };

    // Return translated value or format the raw value nicely
    return translations[value.toUpperCase()] || value.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  };

  // Employee columns
  const employeeColumns = [
    { key: 'fullName', label: 'Nom Complet', width: '200px', align: 'left' as const },
    { key: 'email', label: 'Email', width: '200px', align: 'left' as const },
    { key: 'role', label: 'Rôle', width: '100px', align: 'center' as const, format: formatEnum },
    { key: 'telephone', label: 'Téléphone', width: '120px', align: 'center' as const },
    { key: 'totalPatients', label: 'Patients', width: '100px', align: 'right' as const, format: formatNumber },
    { key: 'totalRentals', label: 'Total Locations', width: '120px', align: 'right' as const, format: formatNumber },
    { key: 'activeRentals', label: 'Locations Actives', width: '130px', align: 'right' as const, format: formatNumber },
    { key: 'completedRentals', label: 'Locations Terminées', width: '150px', align: 'right' as const, format: formatNumber },
    { key: 'totalSales', label: 'Ventes', width: '100px', align: 'right' as const, format: formatNumber },
    { key: 'rentalRevenue', label: 'Revenu Location', width: '150px', align: 'right' as const, format: formatCurrency },
    { key: 'salesRevenue', label: 'Revenu Vente', width: '150px', align: 'right' as const, format: formatCurrency },
    { key: 'totalRevenue', label: 'Revenu Total', width: '150px', align: 'right' as const, format: formatCurrency, className: 'font-bold text-green-700' },
    { key: 'totalAppointments', label: 'RDV Total', width: '100px', align: 'right' as const, format: formatNumber },
    { key: 'completedAppointments', label: 'RDV Terminés', width: '120px', align: 'right' as const, format: formatNumber },
    { key: 'totalDiagnostics', label: 'Diagnostics Total', width: '140px', align: 'right' as const, format: formatNumber },
    { key: 'completedDiagnostics', label: 'Diagnostics Terminés', width: '160px', align: 'right' as const, format: formatNumber },
    { key: 'stockLocation', label: 'Emplacement Stock', width: '150px', align: 'left' as const },
    { key: 'devicesInStock', label: 'Appareils en Stock', width: '150px', align: 'right' as const, format: formatNumber },
    { key: 'activeDevices', label: 'Appareils Actifs', width: '130px', align: 'right' as const, format: formatNumber },
    { key: 'performanceScore', label: 'Score Performance', width: '150px', align: 'right' as const, format: (v: number) => v + '%' },
    { key: 'createdAt', label: 'Date Création', width: '120px', align: 'center' as const }
  ];

  // Patient columns
  const patientColumns = [
    {
      key: 'fullName',
      label: 'Nom Complet',
      width: '200px',
      align: 'left' as const,
      render: (value: any, row: any) => (
        <div className="flex flex-col gap-1">
          <div
            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors font-medium"
            onClick={() => router.push(`/roles/admin/renseignement/patient/${row.id}`)}
          >
            {value}
          </div>
          {row.patientCode && (
            <div
              className="text-xs text-slate-500 font-mono cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => router.push(`/roles/admin/renseignement/patient/${row.id}`)}
            >
              {row.patientCode}
            </div>
          )}
        </div>
      )
    },
    { key: 'patientCode', label: 'Code Patient', width: '120px', align: 'center' as const },
    { key: 'telephone', label: 'Téléphone', width: '120px', align: 'center' as const },
    { key: 'affiliation', label: 'Affiliation', width: '100px', align: 'center' as const, format: formatEnum },
    { key: 'beneficiaryType', label: 'Type Bénéficiaire', width: '150px', align: 'center' as const, format: formatEnum },
    { key: 'cnamId', label: 'CNAM ID', width: '120px', align: 'center' as const },
    { key: 'age', label: 'Âge', width: '80px', align: 'right' as const },
    { key: 'totalRentals', label: 'Total Locations', width: '120px', align: 'right' as const, format: formatNumber },
    { key: 'activeRentals', label: 'Locations Actives', width: '130px', align: 'right' as const, format: formatNumber },
    { key: 'completedRentals', label: 'Locations Terminées', width: '150px', align: 'right' as const, format: formatNumber },
    { key: 'totalSales', label: 'Achats', width: '100px', align: 'right' as const, format: formatNumber },
    { key: 'totalPayments', label: 'Total Paiements', width: '130px', align: 'right' as const, format: formatNumber },
    { key: 'totalPaid', label: 'Total Payé', width: '150px', align: 'right' as const, format: formatCurrency, className: 'font-bold text-green-700' },
    { key: 'totalPending', label: 'En Attente', width: '150px', align: 'right' as const, format: formatCurrency, className: 'font-bold text-orange-600' },
    { key: 'salesTotal', label: 'Montant Ventes', width: '150px', align: 'right' as const, format: formatCurrency },
    { key: 'cnamBons', label: 'Bons CNAM', width: '100px', align: 'right' as const, format: formatNumber },
    { key: 'cnamTotal', label: 'Montant CNAM', width: '150px', align: 'right' as const, format: formatCurrency },
    { key: 'totalDiagnostics', label: 'Diagnostics Total', width: '140px', align: 'right' as const, format: formatNumber },
    { key: 'completedDiagnostics', label: 'Diagnostics Terminés', width: '160px', align: 'right' as const, format: formatNumber },
    { key: 'pendingDiagnostics', label: 'Diagnostics En Attente', width: '180px', align: 'right' as const, format: formatNumber },
    { key: 'totalAppointments', label: 'RDV Total', width: '100px', align: 'right' as const, format: formatNumber },
    { key: 'completedAppointments', label: 'RDV Terminés', width: '120px', align: 'right' as const, format: formatNumber },
    { key: 'upcomingAppointments', label: 'RDV À Venir', width: '120px', align: 'right' as const, format: formatNumber },
    { key: 'activityScore', label: 'Score Activité', width: '120px', align: 'right' as const },
    { key: 'governorate', label: 'Gouvernorat', width: '120px', align: 'left' as const },
    { key: 'delegation', label: 'Délégation', width: '120px', align: 'left' as const },
    { key: 'createdAt', label: 'Date Création', width: '120px', align: 'center' as const },
    { key: 'lastActivity', label: 'Dernière Activité', width: '140px', align: 'center' as const }
  ];

  // Device columns
  const deviceColumns = [
    {
      key: 'name',
      label: 'Nom Appareil',
      width: '200px',
      align: 'left' as const,
      render: (value: any, row: any) => (
        <div className="flex flex-col gap-1">
          <div
            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors font-medium"
            onClick={() => router.push(`/roles/admin/appareils/medical-device/${row.id}`)}
          >
            {value}
          </div>
          {row.deviceCode && (
            <div
              className="text-xs text-slate-500 font-mono cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => router.push(`/roles/admin/appareils/medical-device/${row.id}`)}
            >
              {row.deviceCode}
            </div>
          )}
        </div>
      )
    },
    { key: 'deviceCode', label: 'Code', width: '120px', align: 'center' as const },
    { key: 'type', label: 'Type', width: '150px', align: 'left' as const, format: formatEnum },
    { key: 'brand', label: 'Marque', width: '120px', align: 'left' as const },
    { key: 'model', label: 'Modèle', width: '120px', align: 'left' as const },
    { key: 'serialNumber', label: 'N° Série', width: '150px', align: 'center' as const },
    { key: 'status', label: 'Statut', width: '100px', align: 'center' as const, format: formatEnum },
    { key: 'destination', label: 'Destination', width: '120px', align: 'center' as const, format: formatEnum },
    { key: 'stockLocation', label: 'Emplacement', width: '150px', align: 'left' as const },
    { key: 'purchasePrice', label: 'Prix Achat', width: '120px', align: 'right' as const, format: formatCurrency },
    { key: 'sellingPrice', label: 'Prix Vente', width: '120px', align: 'right' as const, format: formatCurrency },
    { key: 'rentalPrice', label: 'Prix Location', width: '130px', align: 'right' as const, format: formatCurrency },
    { key: 'totalRentals', label: 'Total Locations', width: '120px', align: 'right' as const, format: formatNumber },
    { key: 'activeRentals', label: 'Locations Actives', width: '130px', align: 'right' as const, format: formatNumber },
    { key: 'completedRentals', label: 'Locations Terminées', width: '150px', align: 'right' as const, format: formatNumber },
    { key: 'rentalRevenue', label: 'Revenu Location', width: '150px', align: 'right' as const, format: formatCurrency },
    { key: 'salesCount', label: 'Ventes', width: '100px', align: 'right' as const, format: formatNumber },
    { key: 'salesRevenue', label: 'Revenu Vente', width: '150px', align: 'right' as const, format: formatCurrency },
    { key: 'totalRevenue', label: 'Revenu Total', width: '150px', align: 'right' as const, format: formatCurrency, className: 'font-bold text-green-700' },
    { key: 'repairCount', label: 'Réparations', width: '100px', align: 'right' as const, format: formatNumber },
    { key: 'repairCost', label: 'Coût Réparations', width: '150px', align: 'right' as const, format: formatCurrency, className: 'text-red-600' },
    { key: 'lastRepairDate', label: 'Dernière Réparation', width: '150px', align: 'center' as const },
    { key: 'utilizationRate', label: 'Taux Utilisation', width: '140px', align: 'right' as const },
    { key: 'profitability', label: 'Rentabilité', width: '150px', align: 'right' as const, format: formatCurrency, className: 'font-bold text-blue-700' },
    { key: 'roi', label: 'ROI', width: '100px', align: 'right' as const },
    { key: 'createdAt', label: 'Date Création', width: '120px', align: 'center' as const }
  ];

  // Filter data based on search terms and date range
  const filteredEmployees = useMemo(() => {
    if (!analyticsData) return [];
    let data = analyticsData.employees;

    if (employeeSearch) {
      const searchLower = employeeSearch.toLowerCase();
      data = data.filter(e =>
        e.fullName?.toLowerCase().includes(searchLower) ||
        e.email?.toLowerCase().includes(searchLower) ||
        e.telephone?.toLowerCase().includes(searchLower) ||
        e.role?.toLowerCase().includes(searchLower)
      );
    }

    if (dateFrom || dateTo) {
      data = data.filter(e => {
        // createdAt is in format "YYYY-MM-DD", compare as strings for accuracy
        const createdAtStr = e.createdAt || '';
        if (dateFrom && createdAtStr < dateFrom) return false;
        if (dateTo && createdAtStr > dateTo) return false;
        return true;
      });
    }

    return data;
  }, [analyticsData, employeeSearch, dateFrom, dateTo]);

  const filteredPatients = useMemo(() => {
    if (!analyticsData) return [];
    let data = analyticsData.patients;

    if (patientSearch) {
      const searchLower = patientSearch.toLowerCase();
      data = data.filter(p =>
        p.fullName?.toLowerCase().includes(searchLower) ||
        p.patientCode?.toLowerCase().includes(searchLower) ||
        p.telephone?.toLowerCase().includes(searchLower) ||
        p.cnamId?.toLowerCase().includes(searchLower) ||
        p.governorate?.toLowerCase().includes(searchLower) ||
        p.delegation?.toLowerCase().includes(searchLower)
      );
    }

    if (dateFrom || dateTo) {
      data = data.filter(p => {
        // createdAt is in format "YYYY-MM-DD", compare as strings for accuracy
        const createdAtStr = p.createdAt || '';
        if (dateFrom && createdAtStr < dateFrom) return false;
        if (dateTo && createdAtStr > dateTo) return false;
        return true;
      });
    }

    return data;
  }, [analyticsData, patientSearch, dateFrom, dateTo]);

  const filteredDevices = useMemo(() => {
    if (!analyticsData) return [];
    let data = analyticsData.devices;

    if (deviceSearch) {
      const searchLower = deviceSearch.toLowerCase();
      data = data.filter(d =>
        d.name?.toLowerCase().includes(searchLower) ||
        d.deviceCode?.toLowerCase().includes(searchLower) ||
        d.type?.toLowerCase().includes(searchLower) ||
        d.brand?.toLowerCase().includes(searchLower) ||
        d.model?.toLowerCase().includes(searchLower) ||
        d.serialNumber?.toLowerCase().includes(searchLower) ||
        d.stockLocation?.toLowerCase().includes(searchLower)
      );
    }

    if (dateFrom || dateTo) {
      data = data.filter(d => {
        // createdAt is in format "YYYY-MM-DD", compare as strings for accuracy
        const createdAtStr = d.createdAt || '';
        if (dateFrom && createdAtStr < dateFrom) return false;
        if (dateTo && createdAtStr > dateTo) return false;
        return true;
      });
    }

    return data;
  }, [analyticsData, deviceSearch, dateFrom, dateTo]);

  // Excel export function
  const exportToExcel = () => {
    if (!analyticsData) return;

    const wb = XLSX.utils.book_new();

    // Employees sheet
    const employeesForExport = filteredEmployees.map(e => ({
      'Nom Complet': e.fullName,
      'Email': e.email,
      'Rôle': formatEnum(e.role),
      'Téléphone': e.telephone,
      'Patients': e.totalPatients,
      'Total Locations': e.totalRentals,
      'Locations Actives': e.activeRentals,
      'Locations Terminées': e.completedRentals,
      'Ventes': e.totalSales,
      'Revenu Location (TND)': e.rentalRevenue,
      'Revenu Vente (TND)': e.salesRevenue,
      'Revenu Total (TND)': e.totalRevenue,
      'RDV Total': e.totalAppointments,
      'RDV Terminés': e.completedAppointments,
      'Diagnostics Total': e.totalDiagnostics,
      'Diagnostics Terminés': e.completedDiagnostics,
      'Score Performance': e.performanceScore,
      'Date Création': e.createdAt
    }));
    const wsEmployees = XLSX.utils.json_to_sheet(employeesForExport);
    XLSX.utils.book_append_sheet(wb, wsEmployees, 'Employés');

    // Patients sheet
    const patientsForExport = filteredPatients.map(p => ({
      'Nom Complet': p.fullName,
      'Code Patient': p.patientCode,
      'Téléphone': p.telephone,
      'Affiliation': formatEnum(p.affiliation),
      'Type Bénéficiaire': formatEnum(p.beneficiaryType),
      'CNAM ID': p.cnamId,
      'Âge': p.age,
      'Total Locations': p.totalRentals,
      'Locations Actives': p.activeRentals,
      'Achats': p.totalSales,
      'Total Payé (TND)': p.totalPaid,
      'En Attente (TND)': p.totalPending,
      'Montant Ventes (TND)': p.salesTotal,
      'Bons CNAM': p.cnamBons,
      'Montant CNAM (TND)': p.cnamTotal,
      'Diagnostics Total': p.totalDiagnostics,
      'RDV Total': p.totalAppointments,
      'Score Activité': p.activityScore,
      'Gouvernorat': p.governorate,
      'Délégation': p.delegation,
      'Date Création': p.createdAt
    }));
    const wsPatients = XLSX.utils.json_to_sheet(patientsForExport);
    XLSX.utils.book_append_sheet(wb, wsPatients, 'Patients');

    // Devices sheet
    const devicesForExport = filteredDevices.map(d => ({
      'Nom': d.name,
      'Code': d.deviceCode,
      'Type': formatEnum(d.type),
      'Marque': d.brand,
      'Modèle': d.model,
      'N° Série': d.serialNumber,
      'Statut': formatEnum(d.status),
      'Destination': formatEnum(d.destination),
      'Emplacement': d.stockLocation,
      'Prix Achat (TND)': d.purchasePrice,
      'Prix Vente (TND)': d.sellingPrice,
      'Prix Location (TND)': d.rentalPrice,
      'Total Locations': d.totalRentals,
      'Locations Actives': d.activeRentals,
      'Revenu Location (TND)': d.rentalRevenue,
      'Ventes': d.salesCount,
      'Revenu Vente (TND)': d.salesRevenue,
      'Revenu Total (TND)': d.totalRevenue,
      'Réparations': d.repairCount,
      'Coût Réparations (TND)': d.repairCost,
      'Taux Utilisation': d.utilizationRate,
      'Rentabilité (TND)': d.profitability,
      'ROI': d.roi,
      'Date Création': d.createdAt
    }));
    const wsDevices = XLSX.utils.json_to_sheet(devicesForExport);
    XLSX.utils.book_append_sheet(wb, wsDevices, 'Appareils');

    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `analytics_${today}.xlsx`);
  };

  // Calculate chart data
  const revenueByCategory = useMemo(() => {
    if (!analyticsData) return { rental: 0, sales: 0 };
    const rental = filteredDevices.reduce((sum, d) => sum + Number(d.rentalRevenue || 0), 0);
    const sales = filteredDevices.reduce((sum, d) => sum + Number(d.salesRevenue || 0), 0);
    return { rental, sales };
  }, [analyticsData, filteredDevices]);

  const deviceStatusDistribution = useMemo(() => {
    if (!analyticsData) return {};
    const distribution: Record<string, number> = {};
    filteredDevices.forEach(d => {
      distribution[d.status] = (distribution[d.status] || 0) + 1;
    });
    return distribution;
  }, [analyticsData, filteredDevices]);

  // Sales by year distribution
  const salesByYear = useMemo(() => {
    if (!analyticsData) return {};
    const distribution: Record<string, { count: number; revenue: number }> = {};

    filteredDevices.forEach(d => {
      // Only count devices that have sales (using lastSaleDate for the year)
      if (Number(d.salesCount) > 0 && d.lastSaleDate) {
        const saleDate = new Date(d.lastSaleDate);
        const year = saleDate.getFullYear().toString();

        if (!distribution[year]) {
          distribution[year] = { count: 0, revenue: 0 };
        }
        distribution[year].count += Number(d.salesCount) || 1;
        distribution[year].revenue += Number(d.salesRevenue) || 0;
      }
    });

    // Sort by year descending
    const sortedYears = Object.keys(distribution).sort((a, b) => Number(b) - Number(a));
    const sortedDistribution: Record<string, { count: number; revenue: number }> = {};
    sortedYears.forEach(year => {
      sortedDistribution[year] = distribution[year];
    });

    return sortedDistribution;
  }, [analyticsData, filteredDevices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Chargement des données analytiques...</span>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Erreur de chargement'}</p>
          <Button onClick={fetchAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const { employees, patients, devices, summary } = analyticsData;

  // Status color mapping
  const statusColors: Record<string, string> = {
    'ACTIVE': '#22c55e',
    'AVAILABLE': '#3b82f6',
    'RENTED': '#f59e0b',
    'SOLD': '#8b5cf6',
    'MAINTENANCE': '#ef4444',
    'RESERVED': '#06b6d4'
  };

  // Year colors for sales chart
  const yearColors: string[] = [
    '#8b5cf6', // Purple - current/recent year
    '#3b82f6', // Blue
    '#06b6d4', // Cyan
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#6366f1', // Indigo
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyses & Statistiques Détaillées</h1>
          <p className="text-muted-foreground">
            Vue complète des performances avec statistiques calculées
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={exportToExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter Excel
          </Button>
        </div>
      </div>

      {/* Date Range Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrer par date de création:</span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="dateFrom" className="text-sm text-muted-foreground">Du</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="dateTo" className="text-sm text-muted-foreground">Au</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Distribution Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Répartition des Revenus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Location</span>
                </div>
                <span className="font-medium">{formatCurrency(revenueByCategory.rental)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-500 h-4 transition-all duration-500"
                  style={{
                    width: `${revenueByCategory.rental + revenueByCategory.sales > 0
                      ? (revenueByCategory.rental / (revenueByCategory.rental + revenueByCategory.sales)) * 100
                      : 0}%`
                  }}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Vente</span>
                </div>
                <span className="font-medium">{formatCurrency(revenueByCategory.sales)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-green-500 h-4 transition-all duration-500"
                  style={{
                    width: `${revenueByCategory.rental + revenueByCategory.sales > 0
                      ? (revenueByCategory.sales / (revenueByCategory.rental + revenueByCategory.sales)) * 100
                      : 0}%`
                  }}
                ></div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-green-700">{formatCurrency(revenueByCategory.rental + revenueByCategory.sales)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales by Year Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes par Année</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(salesByYear).map(([year, data], index) => {
                const totalRevenue = Object.values(salesByYear).reduce((a, b) => a + b.revenue, 0);
                const percentage = totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(1) : 0;
                const color = yearColors[index % yearColors.length];
                return (
                  <div key={year} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="font-medium">{year}</span>
                        <span className="text-xs text-muted-foreground">({data.count} ventes)</span>
                      </div>
                      <span className="font-medium">{formatCurrency(data.revenue)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-right text-muted-foreground">{percentage}% du total</div>
                  </div>
                );
              })}
              {Object.keys(salesByYear).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune vente enregistrée</p>
              )}
              {Object.keys(salesByYear).length > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total Ventes</span>
                    <span className="text-purple-700">
                      {formatCurrency(Object.values(salesByYear).reduce((a, b) => a + b.revenue, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                    <span>Nombre total</span>
                    <span>{Object.values(salesByYear).reduce((a, b) => a + b.count, 0)} ventes</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.employees.total}</div>
            <div className="space-y-1 mt-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Revenu Total:</span>
                <span className="font-medium text-green-700">{formatCurrency(summary.employees.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Moy. par Employé:</span>
                <span className="font-medium">{formatCurrency(summary.employees.avgRevenuePerEmployee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Patients:</span>
                <span className="font-medium">{formatNumber(summary.employees.totalPatients)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Locations:</span>
                <span className="font-medium">{formatNumber(summary.employees.totalRentals)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.patients.total}</div>
            <div className="space-y-1 mt-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Revenu Total:</span>
                <span className="font-medium text-green-700">{formatCurrency(summary.patients.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Moy. par Patient:</span>
                <span className="font-medium">{formatCurrency(summary.patients.avgRevenuePerPatient)}</span>
              </div>
              <div className="flex justify-between">
                <span>Locations Actives:</span>
                <span className="font-medium">{formatNumber(summary.patients.activeRentals)}</span>
              </div>
              <div className="flex justify-between">
                <span>Montant CNAM:</span>
                <span className="font-medium">{formatCurrency(summary.patients.totalCnamAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appareils</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.devices.total}</div>
            <div className="space-y-1 mt-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Revenu Total:</span>
                <span className="font-medium text-green-700">{formatCurrency(summary.devices.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Moy. par Appareil:</span>
                <span className="font-medium">{formatCurrency(summary.devices.avgRevenuePerDevice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Coût Réparations:</span>
                <span className="font-medium text-red-600">{formatCurrency(summary.devices.totalRepairCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Rentabilité:</span>
                <span className="font-medium text-blue-700">{formatCurrency(summary.devices.totalProfitability)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs with Excel Tables */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Employés ({filteredEmployees.length})
              </TabsTrigger>
              <TabsTrigger value="patients" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Patients ({filteredPatients.length})
              </TabsTrigger>
              <TabsTrigger value="devices" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Appareils ({filteredDevices.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="employees" className="mt-6 space-y-4">
              {/* Search Bar for Employees */}
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email, téléphone, rôle..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="max-w-md"
                />
                {employeeSearch && (
                  <Button variant="ghost" size="sm" onClick={() => setEmployeeSearch('')}>
                    Effacer
                  </Button>
                )}
              </div>
              <ExcelTable
                title="Statistiques des Employés"
                columns={employeeColumns}
                data={filteredEmployees}
                summary={{
                  fullName: 'TOTAL',
                  totalPatients: filteredEmployees.reduce((sum, e) => sum + e.totalPatients, 0),
                  totalRentals: filteredEmployees.reduce((sum, e) => sum + e.totalRentals, 0),
                  totalSales: filteredEmployees.reduce((sum, e) => sum + e.totalSales, 0),
                  rentalRevenue: filteredEmployees.reduce((sum, e) => sum + Number(e.rentalRevenue), 0).toFixed(2),
                  salesRevenue: filteredEmployees.reduce((sum, e) => sum + Number(e.salesRevenue), 0).toFixed(2),
                  totalRevenue: filteredEmployees.reduce((sum, e) => sum + Number(e.totalRevenue), 0).toFixed(2),
                  completedAppointments: filteredEmployees.reduce((sum, e) => sum + e.completedAppointments, 0),
                  totalAppointments: filteredEmployees.reduce((sum, e) => sum + e.totalAppointments, 0),
                  completedDiagnostics: filteredEmployees.reduce((sum, e) => sum + e.completedDiagnostics, 0),
                  totalDiagnostics: filteredEmployees.reduce((sum, e) => sum + e.totalDiagnostics, 0),
                  devicesInStock: filteredEmployees.reduce((sum, e) => sum + e.devicesInStock, 0),
                  activeDevices: filteredEmployees.reduce((sum, e) => sum + e.activeDevices, 0)
                }}
              />
            </TabsContent>

            <TabsContent value="patients" className="mt-6 space-y-4">
              {/* Search Bar for Patients */}
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, code, téléphone, CNAM, gouvernorat..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="max-w-md"
                />
                {patientSearch && (
                  <Button variant="ghost" size="sm" onClick={() => setPatientSearch('')}>
                    Effacer
                  </Button>
                )}
              </div>
              <ExcelTable
                title="Statistiques des Patients"
                columns={patientColumns}
                data={filteredPatients}
                summary={{
                  fullName: 'TOTAL',
                  totalRentals: filteredPatients.reduce((sum, p) => sum + p.totalRentals, 0),
                  activeRentals: filteredPatients.reduce((sum, p) => sum + p.activeRentals, 0),
                  completedRentals: filteredPatients.reduce((sum, p) => sum + p.completedRentals, 0),
                  totalSales: filteredPatients.reduce((sum, p) => sum + p.totalSales, 0),
                  totalPayments: filteredPatients.reduce((sum, p) => sum + p.totalPayments, 0),
                  totalPaid: filteredPatients.reduce((sum, p) => sum + Number(p.totalPaid), 0).toFixed(2),
                  totalPending: filteredPatients.reduce((sum, p) => sum + Number(p.totalPending), 0).toFixed(2),
                  salesTotal: filteredPatients.reduce((sum, p) => sum + Number(p.salesTotal), 0).toFixed(2),
                  cnamBons: filteredPatients.reduce((sum, p) => sum + p.cnamBons, 0),
                  cnamTotal: filteredPatients.reduce((sum, p) => sum + Number(p.cnamTotal), 0).toFixed(2),
                  totalDiagnostics: filteredPatients.reduce((sum, p) => sum + p.totalDiagnostics, 0),
                  completedDiagnostics: filteredPatients.reduce((sum, p) => sum + p.completedDiagnostics, 0),
                  pendingDiagnostics: filteredPatients.reduce((sum, p) => sum + p.pendingDiagnostics, 0),
                  totalAppointments: filteredPatients.reduce((sum, p) => sum + p.totalAppointments, 0),
                  completedAppointments: filteredPatients.reduce((sum, p) => sum + p.completedAppointments, 0),
                  upcomingAppointments: filteredPatients.reduce((sum, p) => sum + p.upcomingAppointments, 0)
                }}
              />
            </TabsContent>

            <TabsContent value="devices" className="mt-6 space-y-4">
              {/* Search Bar for Devices */}
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, code, type, marque, modèle, N° série..."
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  className="max-w-md"
                />
                {deviceSearch && (
                  <Button variant="ghost" size="sm" onClick={() => setDeviceSearch('')}>
                    Effacer
                  </Button>
                )}
              </div>
              <ExcelTable
                title="Statistiques des Appareils Médicaux"
                columns={deviceColumns}
                data={filteredDevices}
                summary={{
                  name: 'TOTAL',
                  totalRentals: filteredDevices.reduce((sum, d) => sum + d.totalRentals, 0),
                  activeRentals: filteredDevices.reduce((sum, d) => sum + d.activeRentals, 0),
                  completedRentals: filteredDevices.reduce((sum, d) => sum + d.completedRentals, 0),
                  rentalRevenue: filteredDevices.reduce((sum, d) => sum + Number(d.rentalRevenue), 0).toFixed(2),
                  salesCount: filteredDevices.reduce((sum, d) => sum + d.salesCount, 0),
                  salesRevenue: filteredDevices.reduce((sum, d) => sum + Number(d.salesRevenue), 0).toFixed(2),
                  totalRevenue: filteredDevices.reduce((sum, d) => sum + Number(d.totalRevenue), 0).toFixed(2),
                  repairCount: filteredDevices.reduce((sum, d) => sum + d.repairCount, 0),
                  repairCost: filteredDevices.reduce((sum, d) => sum + Number(d.repairCost), 0).toFixed(2),
                  profitability: filteredDevices.reduce((sum, d) => sum + Number(d.profitability), 0).toFixed(2)
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Add AdminLayout wrapper
AnalyticsPage.getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default AnalyticsPage;
