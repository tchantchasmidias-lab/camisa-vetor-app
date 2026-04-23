import CategoryCarousel from "@/components/CategoryCarousel";
import ProductGrid from "@/components/ProductGrid";

export default function Home() {
  return (
    <div className="pt-24 md:pt-28">
      <CategoryCarousel />
      <main className="px-4 md:px-6">
        <ProductGrid />
      </main>
    </div>
  );
}
