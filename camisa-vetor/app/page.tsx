import CategoryCarousel from "@/components/CategoryCarousel";
import ProductGrid from "@/components/ProductGrid";

export default function Home() {
  return (
    // AJUSTE: Padding-top removido para ser controlado pelo componente
    <div>
      <CategoryCarousel />
      <main className="px-4 md:px-6">
        <ProductGrid />
      </main>
    </div>
  );
}
