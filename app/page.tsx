import Navbar from "../components/Navbar"
import Hero from "../components/Hero"
import Choose from "../components/choose"
import Features from "../components/features"
import CTA from "../components/CTASection"
import Footer from "../components/footer"
export default function Page() {
  return (
    <div>
      <Navbar/>
      <Hero/>
      <Choose/>
      <Features/>
      <CTA/>
      <Footer/>
    </div>
  );
}
