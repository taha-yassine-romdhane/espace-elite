import React from "react";
import Link from "next/link";
import Image from "next/image";

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[380px] flex items-center justify-center py-8 lg:py-16">
      <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl shadow-xl flex flex-col lg:flex-row items-center px-4 sm:px-8 py-8 gap-8 border border-blue-50">
        {/* Left (text) */}
        <div className="w-full lg:w-1/2 text-center lg:text-left">
          <h1>
            <span className="block text-base font-semibold uppercase tracking-widest text-blue-700 mb-2">
              Plateforme de Gestion Oxygénothérapie
            </span>
            <span className="block text-4xl sm:text-5xl xl:text-6xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-4">
              Elite Santé CRM
            </span>
          </h1>
          <p className="mt-2 text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
            Optimisez la gestion de vos patients, appareils médicaux et tâches de suivi avec une plateforme moderne, intuitive et sécurisée.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-6">
            <Link href="/auth/signup" className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-blue-700 hover:bg-blue-800 shadow transition-all">
              Commencer
            </Link>
            <Link href="#features" scroll={false} className="inline-flex items-center justify-center px-5 py-2 border border-blue-700 text-sm font-semibold rounded-md text-blue-700 bg-white hover:bg-blue-50 shadow transition-all">
              Découvrir les fonctionnalités
            </Link>
          </div>
        </div>
        {/* Right (image) */}
        <div className="w-full lg:w-1/2 flex justify-center items-center mb-8 lg:mb-0">
          <Image
            src="/welcome.jpg"
            alt="Aperçu Elite Santé CRM"
            width={320}
            height={320}
            className="rounded-xl shadow-xl bg-white p-4"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
