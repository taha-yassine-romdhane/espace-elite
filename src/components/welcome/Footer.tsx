import React from "react";
import { Heart } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-blue-100 bg-gradient-to-t from-white via-blue-50 to-white py-6 mt-8">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center text-sm text-gray-500">
        <div className="flex items-center gap-2 justify-center">
          <Heart className="h-4 w-4 text-blue-700" />
          <span>
            © {new Date().getFullYear()} Elite Santé CRM. Tous droits réservés.
          </span>
        </div>
        <div className="flex gap-4 justify-center">
          <a href="/privacy" className="hover:text-blue-700 transition-colors">Confidentialité</a>
          <a href="/terms" className="hover:text-blue-700 transition-colors">Conditions</a>
          <a href="/contact" className="hover:text-blue-700 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
