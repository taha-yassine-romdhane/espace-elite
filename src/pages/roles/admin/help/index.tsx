import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Mail, Phone, MessageCircle, FileText, Video } from 'lucide-react';

const HelpPage = () => {
    const faqs = [
        {
            question: "Comment ajouter un nouveau produit ?",
            answer: "Pour ajouter un nouveau produit, accédez à la page 'Gestion des Produits', cliquez sur le bouton 'Ajouter un Produit', remplissez le formulaire avec les détails du produit et cliquez sur 'Enregistrer'."
        },
        {
            question: "Comment gérer les locations ?",
            answer: "Depuis le tableau de bord, cliquez sur 'Commencer une Location'. Sélectionnez le type de client, choisissez les produits à louer, et remplissez les informations de paiement."
        },
        {
            question: "Comment suivre l'état des appareils ?",
            answer: "Dans la section 'Gestion des Stock', vous pouvez voir l'état de tous les appareils, leur disponibilité, et leur historique de maintenance."
        },
        {
            question: "Comment gérer les utilisateurs ?",
            answer: "Accédez à la section 'Utilisateurs' pour ajouter, modifier ou désactiver des comptes utilisateurs. Vous pouvez également gérer les permissions ici."
        },
        {
            question: "Comment créer un diagnostic ?",
            answer: "Depuis le tableau de bord, sélectionnez 'Commencer un Diagnostic'. Choisissez le client, l'appareil concerné, et remplissez les informations de diagnostic."
        }
    ];

    const supportChannels = [
        {
            icon: <Phone className="h-6 w-6" />,
            title: "Support Téléphonique",
            description: "Appelez-nous au +216 XX XXX XXX",
            available: "Lun-Ven, 9h-18h"
        },
        {
            icon: <Mail className="h-6 w-6" />,
            title: "Email Support",
            description: "Envoyez-nous un email à support@elite-sante.com",
            available: "Réponse sous 24h"
        },
        {
            icon: <MessageCircle className="h-6 w-6" />,
            title: "Chat en Direct",
            description: "Discutez avec notre équipe en temps réel",
            available: "24/7"
        },
        {
            icon: <FileText className="h-6 w-6" />,
            title: "Documentation",
            description: "Consultez notre documentation détaillée",
            available: "Accès illimité"
        },
        {
            icon: <Video className="h-6 w-6" />,
            title: "Tutoriels Vidéo",
            description: "Regardez nos guides vidéo pas à pas",
            available: "Disponible 24/7"
        }
    ];

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold text-[#1e3a8a] mb-8">Centre d'Aide</h1>
            
            {/* Support Channels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {supportChannels.map((channel, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-[#1e3a8a] text-white">
                                    {channel.icon}
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{channel.title}</CardTitle>
                                    <CardDescription className="text-sm text-gray-500">
                                        {channel.available}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">{channel.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* FAQs */}
            <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-semibold text-[#1e3a8a] mb-6">Questions Fréquentes</h2>
                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-600">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    );
};

export default HelpPage;
