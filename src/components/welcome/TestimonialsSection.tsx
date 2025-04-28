import React from "react";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. A. Ben Salah",
    text: "La plateforme Elite Santé a révolutionné notre gestion médicale. Simple, rapide et efficace !",
    initials: "AB"
  },
  {
    name: "Mme. L. Trabelsi",
    text: "Un outil indispensable pour le suivi des patients et la gestion des tâches au quotidien.",
    initials: "LT"
  },
  {
    name: "M. H. Gharbi",
    text: "L'interface est très intuitive et le support client est réactif. Je recommande vivement !",
    initials: "HG"
  }
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="relative py-16 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-base font-semibold tracking-widest text-blue-700 uppercase mb-2">Témoignages</h2>
        <p className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">Ce que disent nos utilisateurs</p>
        <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-12">Des professionnels de santé et gestionnaires témoignent de leur expérience avec Elite Santé CRM.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-blue-100 shadow-md hover:shadow-xl transition-shadow duration-300 p-8 flex flex-col items-center text-center relative"
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-100 rounded-full p-2">
                <Quote className="h-6 w-6 text-blue-400" />
              </span>
              <div className="mb-4 mt-2">
                <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-700 text-white text-lg font-bold shadow-md border-4 border-white">{t.initials}</span>
              </div>
              <p className="text-gray-700 italic mb-4">“{t.text}”</p>
              <span className="block font-semibold text-blue-700">{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
