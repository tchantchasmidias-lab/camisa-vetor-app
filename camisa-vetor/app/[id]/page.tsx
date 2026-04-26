import ProductDetailView from "@/components/ProductDetailView";

// Isso aqui PRECISA ser componente de servidor (sem 'use client')
export async function generateStaticParams() {
  const ids = ['1', '2', '3', '4', '5', '6'];
  return ids.map((id) => ({
    id: id,
  }));
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetailView params={params} />;
}