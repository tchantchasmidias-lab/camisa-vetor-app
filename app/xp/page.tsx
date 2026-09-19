import { adminDb } from '@/lib/firebaseAdmin';
import XPDesktopClient from '@/components/xp/XPDesktopClient';
import type { Product } from '@/components/HomeClient';
import { formatTitleCase } from '@/lib/stringUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

async function getInitialProducts(): Promise<Product[]> {
  try {
    const productsSnap = await adminDb.collection('products').get();

    const productsData = productsSnap.docs.map(doc => {
      const data = doc.data();
      const rawCreated = data.createdAt;
      const rawUpdated = data.updatedAt;

      let createdTime = 0;
      if (rawCreated?.toMillis) {
        createdTime = rawCreated.toMillis();
      } else if (rawCreated?.seconds) {
        createdTime = rawCreated.seconds * 1000;
      } else if (typeof rawCreated === 'string' || typeof rawCreated === 'number') {
        createdTime = new Date(rawCreated).getTime() || 0;
      } else if (rawUpdated?.toMillis) {
        createdTime = rawUpdated.toMillis();
      } else if (rawUpdated?.seconds) {
        createdTime = rawUpdated.seconds * 1000;
      } else if (typeof rawUpdated === 'string' || typeof rawUpdated === 'number') {
        createdTime = new Date(rawUpdated).getTime() || 0;
      } else {
        createdTime = Date.now();
      }

      return {
        id: doc.id,
        name: formatTitleCase(data.name || 'Sem nome'),
        price: Number(data.price) || 0,
        isFree: Boolean(data.isFree) || Number(data.price) === 0,
        category: data.category || 'Geral',
        slug: data.slug || doc.id,
        createdAt: createdTime,
        urls: {
          capa: data.urls?.capa || data.urls?.destaque || '',
          destaque: data.urls?.destaque || '',
        },
      };
    });

    // Ordena: mais recentes primeiro
    productsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Converte para JSON puro para compatibilidade com Next.js SSR
    return JSON.parse(JSON.stringify(productsData));
  } catch (error) {
    console.error('Erro ao carregar produtos para o modo XP (SSR):', error);
    return [];
  }
}

export default async function XPPage() {
  const initialProducts = await getInitialProducts();

  return (
    <XPDesktopClient initialProducts={initialProducts} />
  );
}
