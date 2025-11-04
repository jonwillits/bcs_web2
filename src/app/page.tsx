import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CoursesSection } from "@/components/CoursesSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";
import { UnauthorizedAlert } from "@/components/unauthorized-alert";

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="min-h-screen">
      <Header />
      <UnauthorizedAlert searchParams={searchParams} />
      <main id="main-content" role="main" aria-label="Main content">
        <Hero />
        <CoursesSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
