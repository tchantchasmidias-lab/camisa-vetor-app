import CategoryCarousel from "@/components/CategoryCarousel";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";

export default function Home() {
  return (
    <div className="bg-white">
      <CategoryCarousel />
      <main className="px-4 md:px-[10%] lg:px-[15%] mt-12">
        <ProductGrid />
      </main>
      <Footer />
    </div>
  );
}
