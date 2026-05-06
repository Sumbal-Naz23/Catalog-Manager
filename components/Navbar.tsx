import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-5 lg:px-12 flex items-center justify-between h-16">
        
        <span className="font-script text-2xl text-black tracking-wide">
          D.K Collection
        </span>

        <div className="hidden md:flex items-center gap-8">
          {["Home", "Catalog", "Contact"].map((item) => (
            <a
              key={item}
              href={item === "Catalog" ? "/dashboard" : "#"}
              className="text-sm font-medium tracking-wide uppercase"
            >
              {item}
            </a>
          ))}
        </div>

        {/* <Link
          href="/dashboard"
          className="px-5 py-2 text-sm font-medium bg-black text-white uppercase hover:bg-[#D4AF37]"
        >
          Open Catalog
        </Link> */}
        <Link
  href="/dashboard"
  className="hidden md:block px-5 py-2 text-sm font-medium bg-black text-white uppercase hover:bg-[#D4AF37]"
>
  Open Catalog
</Link>

      </div>
    </nav>
  );
}