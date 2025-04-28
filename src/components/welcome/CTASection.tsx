import React from "react";
import { Rocket } from "lucide-react";

const CTASection: React.FC = () => {
  return (
    <section className="relative py-6 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 rounded-xl shadow-lg px-4 py-6 flex flex-col items-center text-center border border-blue-100">
          <span className="mb-2 bg-blue-100 rounded-full p-2 flex items-center justify-center">
            <Rocket className="h-6 w-6 text-blue-700" />
          </span>
          <h2 className="text-2xl font-extrabold text-blue-900 sm:text-3xl mb-2">Prêt à améliorer la gestion de votre établissement ?</h2>
          <p className="text-blue-700 mb-4 text-base max-w-md">Créez votre compte dès aujourd'hui et découvrez toutes les fonctionnalités de la plateforme Elite Santé CRM.</p>
          <a
            href="/auth/signup"
            className="inline-block px-5 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-blue-700 hover:bg-blue-800 shadow transition-all"
          >
            Démarrer maintenant
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
