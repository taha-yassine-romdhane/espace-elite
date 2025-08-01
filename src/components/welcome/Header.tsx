import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Espace Elite
              </div>
              <div className="hidden sm:block text-xs text-gray-500 font-medium">
                Medical Device Management
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <div className="relative group">
              <button 
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onMouseEnter={() => setIsProductsOpen(true)}
                onMouseLeave={() => setIsProductsOpen(false)}
              >
                <span>Solutions</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {isProductsOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-4"
                  onMouseEnter={() => setIsProductsOpen(true)}
                  onMouseLeave={() => setIsProductsOpen(false)}
                >
                  <div className="px-6 py-2">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900">Gestion Médicale</h3>
                        <p className="text-sm text-gray-600">Suivi patients et appareils CPAP/VNI</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900">Gestion Commerciale</h3>
                        <p className="text-sm text-gray-600">Ventes, paiements et suivi CNAM</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900">Analytics & Reports</h3>
                        <p className="text-sm text-gray-600">Tableaux de bord et rapports avancés</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Link href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Fonctionnalités
            </Link>
            <Link href="#pricing" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Tarifs
            </Link>
            <Link href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              À propos
            </Link>
            <Link href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Contact
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link 
              href="/auth/signin" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Se connecter
            </Link>
            <Link 
              href="/auth/signup" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Essai gratuit
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4">
            <div className="space-y-4">
              <Link href="#features" className="block text-gray-700 hover:text-blue-600 font-medium">
                Fonctionnalités
              </Link>
              <Link href="#pricing" className="block text-gray-700 hover:text-blue-600 font-medium">
                Tarifs
              </Link>
              <Link href="#about" className="block text-gray-700 hover:text-blue-600 font-medium">
                À propos
              </Link>
              <Link href="#contact" className="block text-gray-700 hover:text-blue-600 font-medium">
                Contact
              </Link>
              <div className="pt-4 space-y-2">
                <Link 
                  href="/auth/signin" 
                  className="block w-full text-center py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Se connecter
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="block w-full text-center py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Essai gratuit
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
