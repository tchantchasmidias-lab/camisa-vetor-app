import { adminDb } from '@/lib/firebaseAdmin';
import HomeClient, { Product } from '@/components/HomeClient';

export const revalidate = 300; // Server-Side Rendering com Revalidação a cada 5 minutos

async function getInitialProducts(): Promise<Product[]> {
  try {
    const productsSnap = await adminDb.collection('products').get();

    const productsData = productsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Sem nome',
        price: Number(data.price) || 0,
        category: data.category || 'Geral',
        slug: data.slug || doc.id,
        createdAt: data.createdAt?.toMillis?.() ?? (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : 0),
        urls: {
          capa: data.urls?.capa || data.urls?.destaque || '',
          destaque: data.urls?.destaque || '',
        },
      };
    });

    // Ordena: mais recentes primeiro
    productsData.sort((a, b) => b.createdAt - a.createdAt);

    // Converte para JSON puro para evitar erros de serialização no Next.js
    return JSON.parse(JSON.stringify(productsData));
  } catch (error) {
    console.error('Erro ao carregar produtos no servidor (SSR):', error);
    return [];
  }
}

export default async function HomePage() {
  const initialProducts = await getInitialProducts();

  // Preload da imagem LCP (primeiro produto) — reduz o gap entre FCP e LCP no PageSpeed
  const lcpImageUrl = initialProducts[0]?.urls?.capa || '';

  return (
    <>
      {/* Hint de Preload injetado no <head> pelo Next.js App Router */}
      {lcpImageUrl && (
        <link
          rel="preload"
          as="image"
          href={lcpImageUrl}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore — fetchpriority é atributo HTML válido mas não tipado em React 18
          fetchpriority="high"
        />
      )}
      <HomeClient initialProducts={initialProducts} />
    </>
  );
}