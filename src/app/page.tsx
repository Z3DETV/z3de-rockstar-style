import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Marquee from "../components/Marquee";
import PinnedShowcase from "../components/PinnedShowcase";
import HorizontalCards from "../components/HorizontalCards";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export default function Page() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      <Hero />
      <Marquee />
      <PinnedShowcase />
      <HorizontalCards />
      <Footer />
    </main>
  );
}
