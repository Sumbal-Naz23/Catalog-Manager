export default function Features() {
  return (
    <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase font-medium">
                Features
              </span>
              <div className="h-px w-8 bg-[#D4AF37]" />
            </div>
            <h2 className="font-display text-4xl font-light text-black">
              Everything You Need
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Smart Folders",
                desc: "Organize Makeup, Perfume, Jewellery and more into elegant collections.",
                icon: "◈",
              },
              {
                title: "Drag & Drop Upload",
                desc: "Upload multiple images instantly. Stored securely on Cloudinary.",
                icon: "◉",
              },
              {
                title: "Pinterest Grid",
                desc: "Beautiful image grid with lazy loading for optimal performance.",
                icon: "◫",
              },
              {
                title: "PWA Support",
                desc: "Install as a native app on any device. Works offline too.",
                icon: "◎",
              },
              {
                title: "MongoDB Storage",
                desc: "Reliable metadata storage with Mongoose for all your catalog data.",
                icon: "◐",
              },
              {
                title: "No Login Required",
                desc: "Single-user system. Open and start managing immediately.",
                icon: "◑",
              },
            ].map(({ title, desc, icon }) => (
              <div
                key={title}
                className="group flex gap-5 p-6 border border-gray-100 hover:border-[#D4AF37]/40 transition-all duration-300"
              >
                <span className="text-[#D4AF37] text-2xl flex-shrink-0 mt-0.5 font-light">{icon}</span>
                <div>
                  <h4 className="font-semibold text-black text-sm mb-1 tracking-wide">{title}</h4>
                  <p className="text-gray-500 text-sm font-light leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
  );
}