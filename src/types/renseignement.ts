import { BeneficiaryType } from '@prisma/client';

export type CaisseAffiliation = 'CNSS' | 'CNRPS';

export interface Person {
  id: string;
  name: string;
  role: string;
}

export interface Renseignement {
  id: string;
  type: 'Patient' | 'Société';
  nom: string;
  adresse: string;
  telephone: string;
  telephoneSecondaire?: string;
  doctor?: Person | null;
  technician?: Person | null;
  files: { url: string; type: string }[];
  dateNaissance?: string;
  cin?: string;
  identifiantCNAM?: string;
  cnam?: boolean;
  taille?: number;
  poids?: number;
  imc?: number;
  antecedant?: string;
  descriptionNom?: string;
  descriptionTelephone?: string;
  descriptionAdresse?: string;
  caisseAffiliation?: CaisseAffiliation;
  beneficiaire?: BeneficiaryType;
  matriculeFiscale?: string;
  phoneDescription?: string;
  addressDescription?: string;
  createdAt: string;
}

export interface UploadedFile {
  url: string;
  type: string;
}

export interface RenseignementFormData {
  id?: string;
  type: 'Patient' | 'Société';
  nomComplet?: string;
  telephonePrincipale?: string;
  telephoneSecondaire?: string;
  adresseComplete?: string;
  cin?: string;
  identifiantCNAM?: string;
  technicienResponsable?: string;
  antecedant?: string;
  taille?: string;
  poids?: string;
  medecin?: string;
  dateNaissance?: string;
  beneficiaire?: BeneficiaryType;
  caisseAffiliation?: CaisseAffiliation;
  cnam?: boolean;
  descriptionNom?: string;
  descriptionTelephone?: string;
  descriptionAdresse?: string;
  nomSociete?: string;
  matriculeFiscale?: string;
  images?: File[];
  files?: File[];
  existingFiles?: UploadedFile[];
}