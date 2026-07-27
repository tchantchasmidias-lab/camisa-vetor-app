import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

// Converte qualquer formato de data do Firestore para Date válido
function safeDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') return val.toDate(); // Firestore Timestamp
  if (val.seconds) return new Date(val.seconds * 1000);     // Timestamp serializado
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://camisavetor.com';

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacidade`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/termos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Páginas dinâmicas dos produtos
  try {
    const productsSnap = await adminDb.collection('products').get();
    const productPages: MetadataRoute.Sitemap = productsSnap.docs.map(doc => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      return {
        url: `${baseUrl}/product/${slug}`,
        lastModified: safeDate(data.updatedAt || data.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };
    });

    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
