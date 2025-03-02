import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { PenSquare } from 'lucide-react';

interface Diagnostic {
  id: string;
  patient: string;
  telephone: string;
  resultat: 'NORMAL' | 'ABNORMAL' | 'EN_ATTENTE';
  technicien: string;
  medecin: string;
  dateInstallation: string;
  dateFin: string;
  remarque?: string;
  appareille: boolean;
}

interface DiagnosticType {
  id: string;
  name: string;
}

interface DiagnosticBrand {
  id: string;
  name: string;
}

interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  technician: {
    id: string;
  };
}

interface Doctor {
  id: string;
  speciality: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function DiagnosticPage() {
  const { data: session } = useSession();
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [types, setTypes] = useState<DiagnosticType[]>([]);
  const [brands, setBrands] = useState<DiagnosticBrand[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [newType, setNewType] = useState('');
  const [newBrand, setNewBrand] = useState('');
  
  const [formData, setFormData] = useState({
    patient: '',
    telephone: '',
    resultat: 'EN_ATTENTE' as const,
    technicien: '',
    medecin: '',
    dateInstallation: '',
    dateFin: '',
    remarque: '',
    appareille: false,
  });

  const fetchDiagnostics = async () => {
    try {
      const response = await fetch('/api/diagnostics');
      const data = await response.json();
      setDiagnostics(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch diagnostics",
        variant: "destructive",
      });
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/technicians');
      const data = await response.json();
      setTechnicians(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch technicians",
        variant: "destructive",
      });
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch doctors",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    fetchTechnicians();
    fetchDoctors();
    // In a real app, you would fetch these from an API
    setTypes([
      { id: '1', name: 'Polygraphe' },
      { id: '2', name: 'Polysomnographie' },
    ]);
    setBrands([
      { id: '1', name: 'Phillips' },
      { id: '2', name: 'ResMed' },
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create diagnostic');

      setIsAddDialogOpen(false);
      setFormData({
        patient: '',
        telephone: '',
        resultat: 'EN_ATTENTE',
        technicien: '',
        medecin: '',
        dateInstallation: '',
        dateFin: '',
        remarque: '',
        appareille: false,
      });
      fetchDiagnostics();
      toast({
        title: "Success",
        description: "Diagnostic added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add diagnostic",
        variant: "destructive",
      });
    }
  };

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would make an API call here
    setTypes([...types, { id: String(types.length + 1), name: newType }]);
    setNewType('');
    setIsTypeDialogOpen(false);
    toast({
      title: "Success",
      description: "Type added successfully",
    });
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would make an API call here
    setBrands([...brands, { id: String(brands.length + 1), name: newBrand }]);
    setNewBrand('');
    setIsBrandDialogOpen(false);
    toast({
      title: "Success",
      description: "Brand added successfully",
    });
  };

  const getResultBadgeVariant = (resultat: string) => {
    switch (resultat) {
      case 'NORMAL':
        return 'default';
      case 'ABNORMAL':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getTechnicianName = (id: string) => {
    const technician = technicians.find(t => t.id === id);
    return technician ? `${technician.firstName} ${technician.lastName}` : '-';
  };

  const getDoctorName = (id: string) => {
    const doctor = doctors.find(d => d.id === id);
    return doctor ? `${doctor.user.firstName} ${doctor.user.lastName}` : '-';
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Historique de Diagnostique</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Appareil diagnostique</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajout d'un Appareil Diagnostique</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="patient">Nom Complet</Label>
                  <Input
                    id="patient"
                    value={formData.patient}
                    onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedType}
                      onValueChange={setSelectedType}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTypeDialogOpen(true)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="brand">Marque</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedBrand}
                      onValueChange={setSelectedBrand}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsBrandDialogOpen(true)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="technicien">Technicien</Label>
                  <Select
                    value={formData.technicien}
                    onValueChange={(value) => setFormData({ ...formData, technicien: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {`${tech.firstName} ${tech.lastName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="medecin">Médecin</Label>
                  <Select
                    value={formData.medecin}
                    onValueChange={(value) => setFormData({ ...formData, medecin: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {`${doctor.user.firstName} ${doctor.user.lastName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="remarque">Remarque</Label>
                  <Input
                    id="remarque"
                    value={formData.remarque}
                    onChange={(e) => setFormData({ ...formData, remarque: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Sauvegarder
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Appareil Diagnostique</TableHead>
            <TableHead>Technicien</TableHead>
            <TableHead>Médecin</TableHead>
            <TableHead>Remarque</TableHead>
            <TableHead>Résultat</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {diagnostics.map((diagnostic) => (
            <TableRow key={diagnostic.id}>
              <TableCell>{diagnostic.patient}</TableCell>
              <TableCell>{types.find(t => t.id === selectedType)?.name || '-'}</TableCell>
              <TableCell>{getTechnicianName(diagnostic.technicien)}</TableCell>
              <TableCell>{getDoctorName(diagnostic.medecin)}</TableCell>
              <TableCell>{diagnostic.remarque || '-'}</TableCell>
              <TableCell>
                <Badge variant={getResultBadgeVariant(diagnostic.resultat)}>
                  {diagnostic.resultat}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon">
                  <PenSquare className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Type Dialog */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajout de Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddType} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Sauvegarder
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Brand Dialog */}
      <Dialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajout de Marque</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBrand} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="brand">Marque</Label>
                <Input
                  id="brand"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Sauvegarder
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
