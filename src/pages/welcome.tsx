import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, FC } from 'react';

// Header Component
const Header: FC = () => (
  <header className="py-6">
    <nav className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <div className="text-3xl font-bold text-blue-800">Elite Santé</div>
      </div>
      <div className="space-x-4">
        <Link href="/auth/signin" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200">
          Se connecter
        </Link>
      </div>
    </nav>
  </header>
);

// Hero Section Component
const HeroSection: FC = () => (
  <section className="lg:grid lg:grid-cols-12 lg:gap-8 py-16">
    <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
      <h1>
        <span className="block text-sm font-semibold uppercase tracking-wide text-blue-600 sm:text-base lg:text-sm xl:text-base">
          Plateforme de Gestion Médicale
        </span>
        <span className="mt-1 block text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent">
          Elite Santé ERP
        </span>
      </h1>
      <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
        Un système de gestion des soins de santé complet conçu pour optimiser les opérations de votre établissement médical.
        De la gestion des patients à la gestion des équipements, nous avons tout ce dont vous avez besoin.
      </p>
      <div className="mt-8 flex space-x-4">
        <Link href="/auth/signup" className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200">
          Commencer
        </Link>
        <Link href="#features" className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200">
          En savoir plus
        </Link>
      </div>
    </div>
    <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
      <div className="relative mx-auto w-full rounded-lg shadow-xl lg:max-w-md overflow-hidden transform transition-all duration-500 hover:scale-105">
        <Image
          className="w-full"
          src="/welcome.jpg"
          width={1000}
          height={1000}
          alt="Dashboard preview"
          quality={100}
        />
      </div>
    </div>
  </section>
);

// Features Section Component
const FeaturesSection: FC = () => (
  <section id="features" className="py-16 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="lg:text-center">
        <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Fonctionnalités</h2>
        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Une solution complète pour votre établissement
        </p>
        <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
          Découvrez comment Elite Santé peut transformer la gestion de votre établissement médical.
        </p>
      </div>

      <div className="mt-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Gestion des patients</h3>
            <p className="mt-2 text-base text-gray-500">
              Gérez efficacement les dossiers patients, les rendez-vous et les traitements en un seul endroit.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Analyse et reporting</h3>
            <p className="mt-2 text-base text-gray-500">
              Accédez à des tableaux de bord et des rapports détaillés pour prendre des décisions éclairées.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Gestion des équipements</h3>
            <p className="mt-2 text-base text-gray-500">
              Suivez l&apos;inventaire, la maintenance et l&apos;utilisation de vos équipements médicaux.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Gestion du personnel</h3>
            <p className="mt-2 text-base text-gray-500">
              Gérez les rôles, les permissions et les plannings de votre personnel médical.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Testimonials Section Component
const TestimonialsSection: FC = () => (
  <section className="py-16 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="lg:text-center mb-12">
        <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Témoignages</h2>
        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Ce que nos clients disent
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="bg-gray-50 p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-800 font-bold">CH</span>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-bold">Centre Hospitalier Régional</h4>
              <p className="text-gray-500">Directeur Médical</p>
            </div>
          </div>
          <p className="text-gray-600 italic">"Elite Santé a transformé notre gestion quotidienne. Nous avons réduit le temps consacré aux tâches administratives de 40%."</p>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-800 font-bold">CM</span>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-bold">Clinique Médicale Privée</h4>
              <p className="text-gray-500">Responsable IT</p>
            </div>
          </div>
          <p className="text-gray-600 italic">"L&apos;intégration a été simple et l&apos;équipe de support est exceptionnelle. Le système est intuitif et adapté à nos besoins spécifiques."</p>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-800 font-bold">CS</span>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-bold">Cabinet Spécialisé</h4>
              <p className="text-gray-500">Médecin Chef</p>
            </div>
          </div>
          <p className="text-gray-600 italic">"La gestion des rendez-vous et le suivi des patients n&apos;ont jamais été aussi efficaces. Un investissement qui en vaut vraiment la peine."</p>
        </div>
      </div>
    </div>
  </section>
);

// CTA Section Component
const CTASection: FC = () => (
  <section className="py-16 bg-blue-700">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="lg:text-center">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          <span className="block">Prêt à transformer votre établissement?</span>
        </h2>
        <p className="mt-4 text-lg leading-6 text-blue-100">
          Rejoignez les centaines d&apos;établissements médicaux qui font confiance à Elite Santé pour leur gestion quotidienne.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/login" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10 transition-all duration-200">
            Commencer maintenant
          </Link>
        </div>
      </div>
    </div>
  </section>
);

// Footer Component
const Footer: FC = () => (
  <footer className="bg-gray-800 text-white">
    <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Elite Santé</h3>
          <p className="text-gray-300">Solution complète de gestion pour établissements médicaux.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Produits</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="text-gray-300 hover:text-white">Gestion des patients</Link></li>
            <li><Link href="#" className="text-gray-300 hover:text-white">Gestion des équipements</Link></li>
            <li><Link href="#" className="text-gray-300 hover:text-white">Analyses et rapports</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Support</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="text-gray-300 hover:text-white">Documentation</Link></li>
            <li><Link href="#" className="text-gray-300 hover:text-white">Centre d&apos;aide</Link></li>
            <li><Link href="#" className="text-gray-300 hover:text-white">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Légal</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="text-gray-300 hover:text-white">Conditions d&apos;utilisation</Link></li>
            <li><Link href="#" className="text-gray-300 hover:text-white">Politique de confidentialité</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-700 pt-8">
        <p className="text-center text-gray-400">
          &copy; 2025 Elite Santé. Tous droits réservés.
        </p>
      </div>
    </div>
  </footer>
);

// Main Welcome Page Component
export default function Welcome() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      const role = (session.user.role as string).toLowerCase();
      router.push(`/roles/${role}`);
    }
  }, [status, router, session]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Header />
          <HeroSection />
        </div>
        <FeaturesSection />
        <TestimonialsSection />
        <CTASection />
      </div>
      <Footer />
    </div>
  );
}