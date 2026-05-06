import Link from "next/link";

export default function CTASection() {
  return (
     <section className="py-28 px-6 bg-black relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              #D4AF37 0px,
              #D4AF37 1px,
              transparent 1px,
              transparent 14px
            )`,
          }}
        />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-8 bg-[#D4AF37]" />
            <span className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase font-medium">
              Begin Now
            </span>
            <div className="h-px w-8 bg-[#D4AF37]" />
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-light text-white mb-4">
            Ready to Elevate
            <br />
            <span className="font-script text-[#D4AF37] italic">Your Collection?</span>
          </h2>
          <div className="divider-gold w-24 mx-auto my-6" />
          <p className="text-white/50 font-light mb-10 leading-relaxed">
            No account required. Start organizing your luxury catalog today.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-12 py-4 bg-[#D4AF37] text-black text-sm font-semibold tracking-[0.15em] uppercase hover:bg-white transition-all duration-300 btn-gold-glow"
          >
            Open Catalog
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
  );
}