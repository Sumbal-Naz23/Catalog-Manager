import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import ImageModel from "@/models/Image";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return "Rs = " + price.toLocaleString("en-IN");
}

async function getProduct(id: string) {
  // Basic ObjectId format guard — prevents Mongoose casting errors
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  await connectDB();
  const image = await ImageModel.findById(id).lean();
  return image ?? null;
}

// ─── Open Graph metadata — WhatsApp reads these to build the card ─────────────

export async function generateMetadata({
  params,
}: PageProps<"/product/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "Product not found — D.K Collection" };
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const title = product.productName
    ? `${product.productName} — D.K Collection`
    : "D.K Collection";
  const description =
    product.productPrice != null
      ? `${formatPrice(product.productPrice)} · D.K Collection`
      : "D.K Collection — Luxury in Every Detail.";

  return {
    title,
    description,
    openGraph: {
      type: "website",
      url: `${base}/product/${id}`,
      title,
      description,
      siteName: "D.K Collection",
      images: [
        {
          url: product.url,
          width: product.width || 1200,
          height: product.height || 1200,
          alt: product.productName || "D.K Collection product",
        },
      ],
    },
    // WhatsApp also checks Twitter card tags as a fallback
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.url],
    },
  };
}

// ─── Page — shown to anyone who opens the link ───────────────────────────────

export default async function ProductPage({
  params,
}: PageProps<"/product/[id]">) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-gray-100 shadow-lg overflow-hidden">

        {/* Gold top bar */}
        <div className="h-1 bg-[#D4AF37]" />

        {/* Product image */}
        <div className="relative aspect-square w-full bg-gray-100">
          <Image
            src={product.url}
            alt={product.productName || "Product image"}
            fill
            sizes="(max-width: 640px) 100vw, 384px"
            className="object-cover"
            priority
          />
        </div>

        {/* Product details */}
        <div className="px-5 py-5">
          {/* Brand */}
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#D4AF37] mb-2">
            D.K Collection
          </p>

          {/* Name */}
          {product.productName ? (
            <h1 className="text-lg font-semibold text-gray-900 leading-snug mb-1">
              {product.productName}
            </h1>
          ) : (
            <h1 className="text-lg font-light text-gray-400 italic leading-snug mb-1">
              Unnamed product
            </h1>
          )}

          {/* Price */}
          {product.productPrice != null ? (
            <p className="text-xl font-bold text-[#D4AF37] mt-3">
              {formatPrice(product.productPrice)}
            </p>
          ) : (
            <p className="text-sm text-gray-400 font-light mt-3">
              Price on request
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[11px] text-gray-400 font-light tracking-wide text-center">
              D.K Collection · Luxury in Every Detail
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
