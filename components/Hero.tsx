import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative  min-h-[700px] flex items-center justify-center pt-10 bg-black overflow-hidden">

      {/* ── Hero ───────────────────────────────────────────────── */}
<section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden bg-black">
  {/* Subtle texture overlay */}
  <div
    className="absolute inset-0 opacity-[0.03]"
    style={{
      backgroundImage: `repeating-linear-gradient(
        45deg,
        #D4AF37 0px,
        #D4AF37 1px,
        transparent 1px,
        transparent 12px
      )`,
    }}
  />

  {/* Gold accent lines */}
  <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-[#D4AF37]/30 to-transparent" />
  <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[#D4AF37]/30 to-transparent" />

  <div className="relative z-10 text-center px-8 max-w-5xl mx-auto -mt-4">
    
    {/* Eyebrow */}
    <div className="flex items-center justify-center gap-3 mb-6">
      <div className="h-px w-12 bg-[#D4AF37]" />
      <span className="text-[#D4AF37] text-xs font-medium tracking-[0.3em] uppercase">
        Luxury Catalog Management
      </span>
      <div className="h-px w-12 bg-[#D4AF37]" />
    </div>

    {/* Main heading */}
    <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl font-light text-white leading-tight mb-12">
      Manage Your
      <br />
      <span className="font-script text-[#D4AF37] italic">
        Product Catalog
      </span>
      <br />
      <span className="font-light">Effortlessly</span>
    </h1>

    {/* Divider */}
    <div className="divider-gold w-32 mx-auto my-6" />

    {/* Subheading */}
    <p className="font-serif text-white text-lg font-light leading-relaxed max-w-xl mx-auto mb-12 tracking-wide">
      Organize your luxury products into elegant folders Upload, manage,
      and showcase your collection with the sophistication it deserves
    </p>

    {/* CTA Buttons */}
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <Link
        href="/dashboard"
        className="group inline-flex items-center gap-3 px-10 py-4 bg-[#D4AF37] text-black text-sm font-semibold tracking-[0.15em] uppercase transition-all duration-300 hover:bg-white btn-gold-glow">
        Open Catalog
        <svg
          className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>

      <a
        href="#features"
        className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white/80 text-sm font-medium tracking-[0.12em] uppercase hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-300"
      >
        Discover More
      </a>
    </div>

  </div>
</section>

    </section>
  );
}