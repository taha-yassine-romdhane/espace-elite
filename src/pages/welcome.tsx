import Header from "@/components/welcome/Header";
import HeroSection from "@/components/welcome/HeroSection";
import FeaturesSection from "@/components/welcome/FeaturesSection";
import TestimonialsSection from "@/components/welcome/TestimonialsSection";
import CTASection from "@/components/welcome/CTASection";
import Footer from "@/components/welcome/Footer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
    <div>
      <Header />
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}