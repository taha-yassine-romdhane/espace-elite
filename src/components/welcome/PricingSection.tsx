import React, { useState } from "react";
import { Check, Star, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

const PricingSection: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const plans = [
    {
      name: "Starter",
      description: "Parfait pour les petites cliniques",
      setupFee: 2500,
      price: { monthly: 299, quarterly: 799, yearly: 2990 },
      originalPrice: { monthly: 399, quarterly: 999, yearly: 3990 },
      features: [
        "Jusqu'à 500 patients",
        "3 utilisateurs inclus", 
        "Gestion appareils CPAP/VNI",
        "Support technique par email",
        "Sauvegarde quotidienne automatique",
        "Mises à jour de sécurité",
        "Maintenance préventive mensuelle",
        "Formation initiale (4 heures)"
      ],
      isPopular: false,
      ctaText: "Commencer",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      name: "Professional",
      description: "Pour les cliniques en croissance",
      setupFee: 4500,
      price: { monthly: 599, quarterly: 1599, yearly: 5990 },
      originalPrice: { monthly: 799, quarterly: 1999, yearly: 7990 },
      features: [
        "Patients illimités",
        "10 utilisateurs inclus",
        "Gestion complète CNAM",
        "Support prioritaire 24/7",
        "Sauvegarde temps réel (cloud)",
        "Mises à jour automatiques",
        "Maintenance hebdomadaire",
        "API et intégrations avancées",
        "Analytics et rapports détaillés",
        "Formation complète (16 heures)",
        "Assistance à la migration des données"
      ],
      isPopular: true,
      ctaText: "Démarrer maintenant",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      name: "Enterprise",
      description: "Solution sur mesure avec support dédié",
      setupFee: null,
      price: { monthly: null, quarterly: null, yearly: null },
      originalPrice: { monthly: null, quarterly: null, yearly: null },
      features: [
        "Tout du plan Professional",
        "Utilisateurs illimités",
        "Serveur dédié haute performance",
        "SLA garanti 99.9% uptime",
        "Gestionnaire de compte dédié",
        "Support sur site disponible",
        "Développements personnalisés",
        "Intégration complète ERP/CRM",
        "Audit de sécurité trimestriel",
        "Formation continue illimitée",
        "Backup géo-redondant",
        "Environnement de test dédié"
      ],
      isPopular: false,
      ctaText: "Demander un devis",
      gradient: "from-gray-700 to-gray-800"
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 rounded-full px-6 py-2 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>Tarification Simple et Transparente</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Choisissez votre plan
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              et démarrez immédiatement
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Des tarifs adaptés à la taille de votre structure. Essai gratuit de 30 jours, 
            sans engagement et avec support inclus.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod('quarterly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
                billingPeriod === 'quarterly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Trimestriel
              <span className="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                -16%
              </span>
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annuel
              <span className="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                -25%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative bg-white rounded-3xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                plan.isPopular 
                  ? 'border-purple-500 shadow-xl' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span>Plus Populaire</span>
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  {plan.price.monthly ? (
                    <div className="space-y-3">
                      {/* Setup Fee */}
                      {plan.setupFee && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <div className="text-sm text-gray-600">Frais d'installation unique</div>
                          <div className="text-2xl font-bold text-gray-900">{plan.setupFee} DT</div>
                        </div>
                      )}
                      
                      {/* Recurring Price */}
                      <div className="flex items-end justify-center space-x-2">
                        <span className="text-5xl font-bold text-gray-900">
                          {billingPeriod === 'monthly' ? plan.price.monthly : 
                           billingPeriod === 'quarterly' ? Math.round(plan.price.quarterly! / 3) :
                           Math.round(plan.price.yearly! / 12)}
                        </span>
                        <span className="text-xl text-gray-600 mb-2">DT</span>
                        <span className="text-gray-500">/mois</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-sm">
                        <span className="line-through text-gray-400">
                          {billingPeriod === 'monthly' ? plan.originalPrice.monthly : 
                           billingPeriod === 'quarterly' ? Math.round(plan.originalPrice.quarterly! / 3) :
                           Math.round(plan.originalPrice.yearly! / 12)} DT
                        </span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                          Économisez {billingPeriod === 'monthly' ? '25%' : 
                                      billingPeriod === 'quarterly' ? '20%' : '25%'}
                        </span>
                      </div>
                      {billingPeriod === 'quarterly' && (
                        <p className="text-sm text-gray-500">
                          Facturé {plan.price.quarterly} DT tous les 3 mois
                        </p>
                      )}
                      {billingPeriod === 'yearly' && (
                        <p className="text-sm text-gray-500">
                          Facturé {plan.price.yearly} DT/an
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-2">Sur mesure</div>
                      <p className="text-gray-600">Tarification adaptée</p>
                      <p className="text-sm text-gray-500 mt-2">Installation et support inclus</p>
                    </div>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIdx) => (
                    <div key={featureIdx} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link
                  href={plan.name === 'Enterprise' ? '#contact' : '/auth/signup'}
                  className={`w-full inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  {plan.ctaText}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Setup Fee Information */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-12 border border-blue-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Frais d'installation uniques
          </h3>
          <p className="text-lg text-gray-600 text-center mb-6">
            L'installation comprend la configuration complète, la migration des données, et la formation de votre équipe
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-2">2 500 DT</div>
              <div className="text-gray-600 font-medium">Plan Starter</div>
              <div className="text-sm text-gray-500 mt-2">Installation en 3 jours</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border-2 border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">4 500 DT</div>
              <div className="text-gray-600 font-medium">Plan Professional</div>
              <div className="text-sm text-gray-500 mt-2">Installation en 5 jours</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-gray-600 mb-2">Sur devis</div>
              <div className="text-gray-600 font-medium">Plan Enterprise</div>
              <div className="text-sm text-gray-500 mt-2">Installation personnalisée</div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">30 jours</div>
              <div className="text-gray-600">Garantie satisfait</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">99.9%</div>
              <div className="text-gray-600">Disponibilité garantie</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-gray-600">Support et maintenance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">ISO 27001</div>
              <div className="text-gray-600">Sécurité certifiée</div>
            </div>
          </div>
        </div>

        {/* FAQ Teaser */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Des questions sur nos tarifs ?
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            Notre équipe commerciale est là pour vous aider à choisir le plan le plus adapté.
          </p>
          <Link
            href="#contact"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
          >
            Contactez-nous pour un devis personnalisé
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;