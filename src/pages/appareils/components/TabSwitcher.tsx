import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TabSwitcherProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="medical-devices">Appareils Médicaux</TabsTrigger>
        <TabsTrigger value="diagnostic-devices">Équipements Diagnostic</TabsTrigger>
        <TabsTrigger value="accessories">Accessoires</TabsTrigger>
        <TabsTrigger value="spare-parts">Pièces de Rechange</TabsTrigger>
        <TabsTrigger value="locations">Emplacements</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
