export default function WhyChooseUs() {
  return (
     <section id="features" className="py-28 px-6 bg-[#fafaf8]">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase font-medium">
                Our Promise
              </span>
              <div className="h-px w-8 bg-[#D4AF37]" />
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-light text-black mb-4">
              Why Choose Us
            </h2>
            <p className="text-gray-500 font-light max-w-md mx-auto leading-relaxed">
              Built for brands that demand nothing less than perfection.
            </p>
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Uncompromising Quality",
                desc: "Every image stored at full resolution via Cloudinary CDN. Your products deserve to be seen in their finest detail.",
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                ),
                title: "Refined Elegance",
                desc: "A clean, minimal interface designed to let your products take center stage. No clutter, no distractions — pure elegance.",
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                ),
                title: "Effortless Simplicity",
                desc: "Drag, drop, and organize in seconds. Powerful catalog management that feels as natural as breathing.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="luxury-card group bg-white border border-gray-100 p-10 text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 border border-[#D4AF37]/40 text-[#D4AF37] mb-6 group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300">
                  {icon}
                </div>
                <h3 className="font-display text-xl font-semibold text-black mb-3">{title}</h3>
                <div className="w-8 h-px bg-[#D4AF37] mx-auto mb-4" />
                <p className="text-gray-500 text-sm font-light leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    // <section className="py-28 px-6 bg-[#fafaf8]">

    //   <div className="text-center mb-16">
    //     <h2 className="text-4xl font-light">Why Choose Us</h2>
    //   </div>

    //   <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

    //     {[
    //       {
    //         title: "Quality",
    //         desc: "High resolution images and luxury experience.",
    //       },
    //       {
    //         title: "Elegance",
    //         desc: "Minimal and premium UI design.",
    //       },
    //       {
    //         title: "Simplicity",
    //         desc: "Easy drag and drop catalog system.",
    //       },
    //     ].map((item) => (
    //       <div key={item.title} className="p-8 border text-center">
    //         <h3 className="mb-2 font-semibold">{item.title}</h3>
    //         <p className="text-gray-500">{item.desc}</p>
    //       </div>
    //     ))}

    //   </div>

    // </section>
  );
}