import React from "react";
import Link from "next/link";
import Image from "next/image";

const Header: React.FC = () => {
  return (

    <header className="max-w-7xl mx-auto py-4 px-4 md:px-8 flex items-center justify-between bg-white shadow-sm sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <Link href="/" aria-label="Accueil Elite Santé CRM" className="flex items-center space-x-2">
          <Image src="/logo_No_BG.png" alt="Logo Elite Santé" width={200} height={200} className="w-20" priority />
        </Link>
      </div>
      <div className="hidden md:block ml-4 space-x-4">
        <Link href="/auth/signin" className="inline-flex items-center px-5 py-2 rounded-md bg-white text-blue-700 font-semibold shadow hover:bg-blue-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400">
          Se connecter
        </Link>
        <Link href="/auth/signup" className="inline-flex items-center px-5 py-2 rounded-md bg-blue-700 text-white font-semibold shadow hover:bg-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400">
          S'inscrire
        </Link>
      </div>
    </header>
  );
};

export default Header;
