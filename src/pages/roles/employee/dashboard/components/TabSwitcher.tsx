import React from "react";
import { Button } from "@/components/ui/button";
import { Stethoscope, Building2, ShoppingCart } from "lucide-react";

interface TabSwitcherProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="flex space-x-2 mb-6 border-b border-gray-200">
      <Button
        variant={activeTab === "diagnostics" ? "default" : "ghost"}
        className={`${
          activeTab === "diagnostics"
            ? "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-800"
            : "text-gray-600 hover:text-green-800"
        } rounded-none border-b-2 ${
          activeTab === "diagnostics" ? "border-green-800" : "border-transparent"
        } px-4 py-2`}
        onClick={() => onTabChange("diagnostics")}
      >
        <Stethoscope className="h-4 w-4 mr-2" />
        Diagnostics
      </Button>
      
      <Button
        variant={activeTab === "rentals" ? "default" : "ghost"}
        className={`${
          activeTab === "rentals"
            ? "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-800"
            : "text-gray-600 hover:text-green-800"
        } rounded-none border-b-2 ${
          activeTab === "rentals" ? "border-green-800" : "border-transparent"
        } px-4 py-2`}
        onClick={() => onTabChange("rentals")}
      >
        <Building2 className="h-4 w-4 mr-2" />
        Locations
      </Button>
      
      <Button
        variant={activeTab === "sales" ? "default" : "ghost"}
        className={`${
          activeTab === "sales"
            ? "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-800"
            : "text-gray-600 hover:text-green-800"
        } rounded-none border-b-2 ${
          activeTab === "sales" ? "border-green-800" : "border-transparent"
        } px-4 py-2`}
        onClick={() => onTabChange("sales")}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Vents
      </Button>
    </div>
  );
}

export default TabSwitcher;
