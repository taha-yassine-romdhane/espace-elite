import React from "react";
import { Users, Stethoscope, ClipboardCheck, Bell, ShieldCheck, BarChart2 } from "lucide-react";

const features = [
  {
    icon: <Users className="h-8 w-8 text-blue-700" />, 
    title: "Gestion des patients",
    desc: "Suivi complet des dossiers patients, historique médical et gestion des contacts."
  },
  {
    icon: <Stethoscope className="h-8 w-8 text-blue-700" />, 
    title: "Appareils médicaux",
    desc: "Inventaire, réservation, maintenance et historique d'utilisation des équipements."
  },
  {
    icon: <ClipboardCheck className="h-8 w-8 text-blue-700" />, 
    title: "Gestion des tâches",
    desc: "Planification, suivi et notifications pour les tâches de suivi et de maintenance."
  },
  {
    icon: <Bell className="h-8 w-8 text-blue-700" />, 
    title: "Notifications intelligentes",
    desc: "Alertes automatiques pour les rendez-vous, résultats à saisir et maintenances à venir."
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-blue-700" />, 
    title: "Sécurité et confidentialité",
    desc: "Protection des données sensibles et gestion des accès par rôle."
  },
  {
    icon: <BarChart2 className="h-8 w-8 text-blue-700" />, 
    title: "Tableaux de bord avancés",
    desc: "Visualisation des indicateurs clés et reporting en temps réel."
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="relative py-16 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-base font-semibold tracking-widest text-blue-700 uppercase mb-2">Fonctionnalités</h2>
        <p className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">Une plateforme complète, pensée pour vous</p>
        <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-12">Découvrez comment Elite Santé CRM optimise chaque aspect de votre gestion médicale, de l'accueil patient à l'analyse de vos performances.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-7 flex flex-col items-center text-center border border-blue-100 group cursor-pointer h-full"
            >
              <div className="mb-3 group-hover:scale-110 transition-transform duration-200">
                {feat.icon}
              </div>
              <h3 className="text-lg font-semibold text-blue-700 mb-2 group-hover:text-indigo-700 transition-colors duration-200">{feat.title}</h3>
              <p className="text-gray-600 text-sm">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
