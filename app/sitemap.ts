import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { buildCleanImageUrl } from '@/lib/mediaUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<any[]> {
  const baseUrl = 'https://camisavetor.com.br';

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/privacidade`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${baseUrl}/termos`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
  ];

  try {
    const productsSnap = await adminDb.collection('products').get();

    const productUrls = productsSnap.docs.map((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const lastmod = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date();

      // Metadados de imagem aceitos pelo Google Search Console
      const rawImage =
        data.coverImage ||
        (Array.isArray(data.images) ? data.images[0] : null) ||
        data.urls?.capa ||
        data.urls?.destaque ||
        '';

      const cleanImage = rawImage ? buildCleanImageUrl(rawImage, slug, 'capa') : '';

      return {
        url: `${baseUrl}/product/${slug}`,
        lastModified: lastmod,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
        images: cleanImage ? [cleanImage] : [],
      };
    });

    const blogSnap = await adminDb.collection('blog_posts').where('published', '==', true).get();
    const blogUrls = blogSnap.docs.map((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const lastmod = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date();
      return {
        url: `${baseUrl}/blog/${slug}`,
        lastModified: lastmod,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
        images: data.coverImage ? [data.coverImage] : [],
      };
    });

    return [...staticPages, ...productUrls, ...blogUrls];
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
    return staticPages;
  }
}