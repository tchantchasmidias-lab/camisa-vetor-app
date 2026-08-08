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
  const baseUrl = 'https://camisavetor.com.br';

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                      lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/blog`,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${baseUrl}/privacidade`,     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${baseUrl}/termos`,          lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  ];

  // Páginas dinâmicas dos produtos — COM IMAGENS para indexação pelo Google
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const productsSnap = await adminDb.collection('products').get();

    productPages = productsSnap.docs.map(doc => {
      const data = doc.data();
      const slug  = data.slug || doc.id;
      const name  = data.name  || 'Vetor';

      // Monta lista de imagens: destaque → capa → galeria
      // O Google usa a 1ª imagem como principal nos resultados de busca
      const images: { url: string; title?: string; caption?: string }[] = [];

      if (data.urls?.destaque) {
        images.push({ url: data.urls.destaque, title: name, caption: `${name} — Camisa Vetor` });
      }
      if (data.urls?.capa && data.urls.capa !== data.urls?.destaque) {
        images.push({ url: data.urls.capa, title: `${name} — Capa` });
      }
      if (Array.isArray(data.urls?.galeria)) {
        (data.urls.galeria as string[]).forEach((imgUrl, i) => {
          if (imgUrl) images.push({ url: imgUrl, title: `${name} — foto ${i + 1}` });
        });
      }

      return {
        url: `${baseUrl}/product/${slug}`,
        lastModified: safeDate(data.updatedAt || data.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
        // Propriedade de extensão de imagens para o Google Image Search
        images: images.length > 0 ? images : undefined,
      };
    });
  } catch (error) {
    console.error('Sitemap: erro ao buscar produtos', error);
  }

  // Posts do blog publicados
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const blogSnap = await adminDb
      .collection('blog_posts')
      .where('published', '==', true)
      .get();

    blogPages = blogSnap.docs.map(doc => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      return {
        url: `${baseUrl}/blog/${slug}`,
        lastModified: safeDate(data.updatedAt || data.createdAt),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      };
    });
  } catch (error) {
    console.error('Sitemap: erro ao buscar posts do blog', error);
  }

  return [...staticPages, ...productPages, ...blogPages];
}
