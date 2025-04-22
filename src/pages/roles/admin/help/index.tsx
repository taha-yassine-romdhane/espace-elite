import React, { useState } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MessageCircle, FileText, Video, Search, BookOpen, HelpCircle, Users, Package, Calendar, Activity, Headphones, ExternalLink, ChevronRight } from 'lucide-react';
import AdminLayout from "../AdminLayout";
import Head from "next/head";

const HelpPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    
    // Categories for FAQs
    const faqCategories = [
        { id: 'general', name: 'Général', icon: <HelpCircle className="h-4 w-4" /> },
        { id: 'products', name: 'Produits', icon: <Package className="h-4 w-4" /> },
        { id: 'users', name: 'Utilisateurs', icon: <Users className="h-4 w-4" /> },
        { id: 'diagnostics', name: 'Diagnostics', icon: <Activity className="h-4 w-4" /> },
        { id: 'rentals', name: 'Locations', icon: <Calendar className="h-4 w-4" /> }
    ];
    interface FAQ {
        question: string;
        answer: string;
        category: string;
    }
    
    const faqs: FAQ[] = [
        {
            question: "Comment ajouter un nouveau produit ?",
            answer: "Pour ajouter un nouveau produit, accédez à la page 'Gestion des Produits', cliquez sur le bouton 'Ajouter un Produit', remplissez le formulaire avec les détails du produit et cliquez sur 'Enregistrer'.",
            category: "products"
        },
        {
            question: "Comment gérer les locations ?",
            answer: "Depuis le tableau de bord, cliquez sur 'Commencer une Location'. Sélectionnez le type de client, choisissez les produits à louer, et remplissez les informations de paiement.",
            category: "rentals"
        },
        {
            question: "Comment suivre l'état des appareils ?",
            answer: "Dans la section 'Gestion des Stock', vous pouvez voir l'état de tous les appareils, leur disponibilité, et leur historique de maintenance.",
            category: "products"
        },
        {
            question: "Comment gérer les utilisateurs ?",
            answer: "Accédez à la section 'Utilisateurs' pour ajouter, modifier ou désactiver des comptes utilisateurs. Vous pouvez également gérer les permissions ici.",
            category: "users"
        },
        {
            question: "Comment créer un diagnostic ?",
            answer: "Depuis le tableau de bord, sélectionnez 'Commencer un Diagnostic'. Choisissez le client, l'appareil concerné, et remplissez les informations de diagnostic.",
            category: "diagnostics"
        },
        {
            question: "Comment modifier les informations d'un patient ?",
            answer: "Accédez à la section 'Patients', recherchez le patient concerné, cliquez sur l'icône d'édition, modifiez les informations nécessaires et cliquez sur 'Enregistrer'.",
            category: "users"
        },
        {
            question: "Comment consulter l'historique des diagnostics d'un patient ?",
            answer: "Accédez à la fiche du patient concerné, puis naviguez vers l'onglet 'Historique des Diagnostics' pour voir tous les diagnostics précédents avec leurs détails.",
            category: "diagnostics"
        },
        {
            question: "Comment générer un rapport de diagnostic ?",
            answer: "Depuis la page de détails d'un diagnostic, cliquez sur le bouton 'Générer un Rapport'. Vous pouvez ensuite télécharger le rapport au format PDF ou l'envoyer directement au patient par email.",
            category: "diagnostics"
        },
        {
            question: "Comment réserver un appareil pour un diagnostic futur ?",
            answer: "Lors de la création d'un diagnostic, cochez l'option 'Réserver l'appareil' et sélectionnez la date de réservation. L'appareil sera automatiquement marqué comme réservé jusqu'à cette date.",
            category: "products"
        },
        {
            question: "Comment créer une tâche liée à un diagnostic ?",
            answer: "Depuis la page de détails d'un diagnostic, cliquez sur 'Ajouter une Tâche', remplissez le formulaire avec les détails de la tâche et associez-la au patient concerné.",
            category: "general"
        }
    ];

    // Knowledge base articles
    const knowledgeBase = [
        {
            title: "Guide complet de l'interface d'administration",
            description: "Découvrez toutes les fonctionnalités de l'interface d'administration d'Elite Santé",
            icon: <BookOpen className="h-6 w-6" />,
            category: "Guide",
            url: "/docs/admin-guide.pdf"
        },
        {
            title: "Procédures de diagnostic",
            description: "Protocoles et meilleures pratiques pour réaliser des diagnostics précis",
            icon: <Activity className="h-6 w-6" />,
            category: "Procédure",
            url: "/docs/diagnostic-procedures.pdf"
        },
        {
            title: "Gestion des appareils médicaux",
            description: "Comment gérer efficacement l'inventaire des appareils médicaux",
            icon: <Package className="h-6 w-6" />,
            category: "Guide",
            url: "/docs/device-management.pdf"
        },
        {
            title: "Système de réservation d'appareils",
            description: "Guide détaillé sur l'utilisation du système de réservation d'appareils",
            icon: <Calendar className="h-6 w-6" />,
            category: "Tutoriel",
            url: "/docs/reservation-system.pdf"
        },
        {
            title: "Gestion des tâches et notifications",
            description: "Comment utiliser efficacement le système de tâches pour le suivi des patients",
            icon: <Calendar className="h-6 w-6" />,
            category: "Tutoriel",
            url: "/docs/task-management.pdf"
        },
        {
            title: "Sécurité et confidentialité des données",
            description: "Bonnes pratiques pour assurer la sécurité des données patients",
            icon: <Users className="h-6 w-6" />,
            category: "Sécurité",
            url: "/docs/data-security.pdf"
        }
    ];

    const supportChannels = [
        {
            icon: <Phone className="h-6 w-6" />,
            title: "Support Téléphonique",
            description: "Assistance technique prioritaire",
            contact: "+216 71 123 456",
            available: "Lun-Ven, 9h-18h",
            priority: "high"
        },
        {
            icon: <Mail className="h-6 w-6" />,
            title: "Support par Email",
            description: "Assistance technique par email",
            contact: "support@elite-sante.com",
            available: "Réponse sous 24h",
            priority: "medium"
        },
        {
            icon: <MessageCircle className="h-6 w-6" />,
            title: "Chat en Direct",
            description: "Assistance immédiate pour questions rapides",
            contact: "Cliquez sur l'icône de chat en bas à droite",
            available: "24/7",
            priority: "medium"
        },
        {
            icon: <Headphones className="h-6 w-6" />,
            title: "Support Dédié",
            description: "Votre conseiller technique personnel",
            contact: "Contactez votre conseiller attitré",
            available: "Sur rendez-vous",
            priority: "high"
        }
    ];

    // Filter FAQs based on search query and selected category
    const filterFaqs = (faqs: FAQ[], query: string, category = '') => {
        return faqs.filter(faq => {
            const matchesQuery = query === '' || 
                faq.question.toLowerCase().includes(query.toLowerCase()) || 
                faq.answer.toLowerCase().includes(query.toLowerCase());
            
            const matchesCategory = category === '' || faq.category === category;
            
            return matchesQuery && matchesCategory;
        });
    };

    return (
        

            <div className="container mx-auto py-8 px-4 max-w-7xl">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 mb-10 text-white">
                    <h1 className="text-3xl font-bold mb-4">Centre d'Aide et de Support</h1>
                    <p className="text-blue-100 mb-6 max-w-2xl">Trouvez rapidement des réponses à vos questions et accédez à notre support technique pour vous aider à utiliser efficacement la plateforme Elite Santé.</p>
                    
                    {/* Search Bar */}
                    <div className="relative max-w-xl">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={20} />
                        <Input 
                            type="text" 
                            placeholder="Rechercher dans le centre d'aide..." 
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {/* FAQs Section */}
                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle className="text-2xl font-semibold text-blue-800">Questions Fréquentes</CardTitle>
                                <CardDescription>Trouvez rapidement des réponses aux questions les plus courantes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="general" className="w-full">
                                    <TabsList className="mb-4 flex flex-wrap">
                                        <TabsTrigger value="">Tous</TabsTrigger>
                                        {faqCategories.map(category => (
                                            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1">
                                                {category.icon}
                                                {category.name}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                    
                                    {['', ...faqCategories.map(c => c.id)].map(categoryId => (
                                        <TabsContent key={categoryId || 'all'} value={categoryId || 'general'} className="mt-0">
                                            <Accordion type="single" collapsible className="w-full">
                                                {filterFaqs(faqs, searchQuery, categoryId).map((faq : FAQ, index: number) => (
                                                    <AccordionItem key={index} value={`item-${categoryId}-${index}`}>
                                                        <AccordionTrigger className="text-left font-medium text-blue-900 hover:text-blue-700">
                                                            {faq.question}
                                                        </AccordionTrigger>
                                                        <AccordionContent className="text-gray-700">
                                                            {faq.answer}
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                            
                                            {filterFaqs(faqs, searchQuery, categoryId).length === 0 && (
                                                <div className="text-center py-8">
                                                    <HelpCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                                    <p className="text-gray-500">Aucune question ne correspond à votre recherche</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>

                        {/* Knowledge Base */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl font-semibold text-blue-800">Base de Connaissances</CardTitle>
                                <CardDescription>Guides détaillés et documentation technique</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {knowledgeBase
                                        .filter(article => 
                                            searchQuery === '' || 
                                            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            article.description.toLowerCase().includes(searchQuery.toLowerCase())
                                        )
                                        .map((article, index) => (
                                        <Card key={index} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                                                        {article.icon}
                                                    </div>
                                                    <div>
                                                        <Badge variant="outline" className="mb-2 text-xs font-normal">
                                                            {article.category}
                                                        </Badge>
                                                        <CardTitle className="text-base font-medium">{article.title}</CardTitle>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pb-2">
                                                <p className="text-sm text-gray-600">{article.description}</p>
                                            </CardContent>
                                            <CardFooter className="pt-0">
                                                <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 p-0 h-8 flex items-center gap-1">
                                                    Consulter <ExternalLink size={14} />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                                
                                {knowledgeBase.filter(article => 
                                    searchQuery === '' || 
                                    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    article.description.toLowerCase().includes(searchQuery.toLowerCase())
                                ).length === 0 && (
                                    <div className="text-center py-8">
                                        <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                        <p className="text-gray-500">Aucun article ne correspond à votre recherche</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        {/* Support Channels */}
                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle className="text-2xl font-semibold text-blue-800">Support Technique</CardTitle>
                                <CardDescription>Contactez notre équipe pour une assistance personnalisée</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {supportChannels.map((channel, index) => (
                                    <div key={index} className={`p-4 rounded-lg border ${channel.priority === 'high' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'} hover:shadow-md transition-shadow`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2 rounded-lg ${channel.priority === 'high' ? 'bg-blue-600' : 'bg-blue-500'} text-white`}>
                                                {channel.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-blue-900">{channel.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
                                                <p className="text-sm font-medium text-blue-700 mt-2">{channel.contact}</p>
                                                <p className="text-xs text-gray-500 mt-1">Disponibilité: {channel.available}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Contact Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl font-semibold text-blue-800">Nous Contacter</CardTitle>
                                <CardDescription>Envoyez-nous un message et nous vous répondrons dans les plus brefs délais</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="subject" className="text-sm font-medium">Sujet</label>
                                        <Input id="subject" placeholder="Sujet de votre demande" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="message" className="text-sm font-medium">Message</label>
                                        <textarea 
                                            id="message" 
                                            rows={4} 
                                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Décrivez votre problème ou votre question..."
                                        />
                                    </div>
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                        Envoyer le message
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
      
    );
};

export default HelpPage;
