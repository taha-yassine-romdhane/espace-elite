import React from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ChevronRight, Plus, Stethoscope } from 'lucide-react';
import DiagnosticTable from '@/pages/roles/admin/dashboard/components/tables/DiagnosticTable';

export default function DiagnosticsPage() {
  const router = useRouter();

  const handleViewDetails = (id: string) => {
    router.push(`/roles/admin/diagnostics/${id}`);
  };

  const handleEnterResults = (id: string) => {
    router.push(`/roles/admin/diagnostics/${id}/results`);
  };

  const handleAddDocuments = (id: string) => {
    router.push(`/roles/admin/diagnostics/${id}/documents`);
  };

  const handleNewDiagnostic = () => {
    router.push('/roles/admin/dashboard/new-diagnostic');
  };

  return (
    <>
      <div className="container mx-auto py-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/roles/admin/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink>Diagnostics</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6" />
            Diagnostics
          </h1>
          <Button 
            onClick={handleNewDiagnostic}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Nouveau diagnostic
          </Button>
        </div>

        {/* Diagnostics Table Card */}
        <Card>
          <CardHeader className="bg-muted/50">
            <CardTitle>Liste des diagnostics</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <DiagnosticTable 
              onViewDetails={handleViewDetails}
              onEnterResults={handleEnterResults}
              onAddDocuments={handleAddDocuments}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
