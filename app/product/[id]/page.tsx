import ProductDetailView from "@/components/ProductDetailView";

// Esta função gera os caminhos estáticos necessários para o 'output: export'
export async function generateStaticParams() {
  const ids = ['1', '2', '3', '4', '5', '6'];
  return ids.map((id) => ({
    id: id,
  }));
}

// O componente principal da página
export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetailView params={params} />;
}