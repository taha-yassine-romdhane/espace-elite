import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Stethoscope, ShoppingCart, Building2 } from "lucide-react";

interface TabSwitcherProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="flex space-x-2 mb-6 border-b border-gray-200">
      <Button
        variant={activeTab === "appointments" ? "default" : "ghost"}
        className={`${
          activeTab === "appointments"
            ? "bg-purple-100 text-purple-800 hover:bg-purple-200 hover:text-purple-800"
            : "text-gray-600 hover:text-purple-800"
        } rounded-none border-b-2 ${
          activeTab === "appointments" ? "border-purple-800" : "border-transparent"
        } px-4 py-2`}
        onClick={() => onTabChange("appointments")}
      >
        <Calendar className="h-4 w-4 mr-2" />
        Rendez-vous
      </Button>
      
      <Button
        variant={activeTab === "diagnostics" ? "default" : "ghost"}
        className={`${
          activeTab === "diagnostics"
            ? "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-800"
            : "text-gray-600 hover:text-blue-800"
        } rounded-none border-b-2 ${
          activeTab === "diagnostics" ? "border-blue-800" : "border-transparent"
        } px-4 py-2`}
        onClick={() => onTabChange("diagnostics")}
      >
        <Stethoscope className="h-4 w-4 mr-2" />
        Diagnostics
      </Button>
      
      <Button
        variant={activeTab === "sales" ? "default" : "ghost"}
        className={`${
          activeTab === "sales"
            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 hover:text-emerald-800"
            : "text-gray-600 hover:text-emerald-800"
        } rounded-none border-b-2 ${
          activeTab === "sales" ? "border-emerald-800" : "border-transparent"
        } px-4 py-2`}
        onClick={() => onTabChange("sales")}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Ventes
      </Button>
      
      <Button
        variant={activeTab === "rentals" ? "default" : "ghost"}
        className={`${
          activeTab === "rentals"
            ? "bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-800"
            : "text-gray-600 hover:text-orange-800"
        } rounded-none border-b-2 ${
          activeTab === "rentals" ? "border-orange-800" : "border-transparent"
        } px-4 py-2`}
        onClick={() => onTabChange("rentals")}
      >
        <Building2 className="h-4 w-4 mr-2" />
        Locations
      </Button>
    </div>
  );
}

export default TabSwitcher;
