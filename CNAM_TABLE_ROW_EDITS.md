# CNAM Bons Table - Inline Edit Instructions

## Summary
The CNAM progression system has **7 steps** (not 10 as currently hardcoded):
1. En attente d'approbation CNAM
2. Accord est avec patient
3. Technicien récupère Bon Achat / Location CNAM
4. Livraison Bon Achat à l'Admin
5. Livraison au Technicien
6. Signature Médecin
7. Livraison au Admin

## Changes Made to Backend (✅ Complete)
1. ✅ Added `currentStep` to `handleSave()` in CNAMBonsExcelTable.tsx
2. ✅ Added `currentStep` extraction and update in `/api/cnam-bons/[id].ts`

## Frontend Changes Needed

### In CNAMBonsExcelTable.tsx around line 800

**Find the table rows mapping section** that starts with:
```typescript
{paginatedDossiers.map((dossier, index) => {
  const patientName = dossier.patient
    ? `${dossier.patient.firstName} ${dossier.patient.lastName}`
    : 'N/A';

  return (
```

**Add these lines RIGHT AFTER `const patientName = ...`:**
```typescript
const isEditing = editingId === dossier.id;
const currentData = isEditing ? editedData : dossier;
```

**Update the `<tr>` className** to include edit highlighting:
```typescript
className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${
  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
} ${isEditing ? 'bg-blue-50' : ''}`}
```

### Update Progression Cell (around line 867-870)

**Replace**:
```typescript
{/* Progress */}
<td className="px-3 py-2.5 border-r border-slate-100">
  {getProgressBar(dossier.currentStep, dossier.totalSteps)}
</td>
```

**With**:
```typescript
{/* Progress - Editable current step */}
<td className="px-3 py-2.5 border-r border-slate-100">
  {isEditing ? (
    <div className="flex items-center gap-2">
      <Select
        value={currentData.currentStep?.toString() || '1'}
        onValueChange={(value) => handleFieldChange('currentStep', parseInt(value))}
      >
        <SelectTrigger className="h-8 text-xs w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Étape 1 - Attente approbation</SelectItem>
          <SelectItem value="2">Étape 2 - Accord avec patient</SelectItem>
          <SelectItem value="3">Étape 3 - Tech récupère bon</SelectItem>
          <SelectItem value="4">Étape 4 - Livraison à admin</SelectItem>
          <SelectItem value="5">Étape 5 - Livraison au tech</SelectItem>
          <SelectItem value="6">Étape 6 - Signature médecin</SelectItem>
          <SelectItem value="7">Étape 7 - Livraison finale</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ) : (
    getProgressBar(dossier.currentStep, 7)
  )}
</td>
```

**Note**: Changed `dossier.totalSteps` to `7` (the actual number of steps)

### Update Status Cell (around line 872-875)

**Replace**:
```typescript
{/* Status */}
<td className="px-3 py-2.5 text-center border-r border-slate-100">
  {getStatusBadge(dossier.status)}
</td>
```

**With**:
```typescript
{/* Status - Editable */}
<td className="px-3 py-2.5 text-center border-r border-slate-100">
  {isEditing ? (
    <Select
      value={currentData.status || 'EN_ATTENTE_APPROBATION'}
      onValueChange={(value) => handleFieldChange('status', value)}
    >
      <SelectTrigger className="h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="EN_ATTENTE_APPROBATION">En attente</SelectItem>
        <SelectItem value="APPROUVE">Approuvé</SelectItem>
        <SelectItem value="TERMINE">Terminé</SelectItem>
        <SelectItem value="REFUSE">Refusé</SelectItem>
      </SelectContent>
    </Select>
  ) : (
    getStatusBadge(dossier.status)
  )}
</td>
```

### Update Actions Cell (around line 886-916)

**Replace the entire actions cell** with this:
```typescript
{/* Actions */}
<td className="px-3 py-2.5 sticky right-0 bg-inherit shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
  <div className="flex items-center justify-center gap-1">
    {isEditing ? (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white"
          title="Enregistrer"
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
          title="Annuler"
        >
          <X className="h-4 w-4" />
        </Button>
      </>
    ) : (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetails(dossier)}
          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
          title="Voir détails"
        >
          <FileText className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEdit(dossier)}
          className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-700"
          title="Modifier"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(dossier.id)}
          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </>
    )}
  </div>
</td>
```

### Fix Hardcoded totalSteps=10 (around line 165-166)

**Find**:
```typescript
currentStep: bon.status === 'TERMINE' ? 10 : bon.status === 'APPROUVE' ? 7 : 3,
totalSteps: 10,
```

**Replace with**:
```typescript
currentStep: bon.currentStep || (bon.status === 'TERMINE' ? 7 : bon.status === 'APPROUVE' ? 5 : 3),
totalSteps: 7,
```

**Also check around line 195-196** for standalone bons and make the same change.

## Result
- ✅ Click Edit button → Progression and Status become dropdowns
- ✅ Select step 1-7 from dropdown
- ✅ Select status from dropdown
- ✅ Click Save (green button) to save changes
- ✅ Click X (cancel button) to cancel
- ✅ Progression bar shows correct percentage based on 7 steps

## Testing
1. Refresh the page
2. Click the Edit (pencil) button on a CNAM bon row
3. Change the step and status dropdowns
4. Click Save (green checkmark)
5. Verify the progression bar updates
