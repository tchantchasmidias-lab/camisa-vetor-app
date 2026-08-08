import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { buildCleanImageUrl } from '@/lib/mediaUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalida o sitemap a cada 1 hora

function safeIsoDate(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val.toDate === 'function') return val.toDate().toISOString();
  if (val.seconds) return new Date(val.seconds * 1000).toISOString();
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = 'https://camisavetor.com.br';

  const staticPages = [
    { url: baseUrl,                      lastmod: new Date().toISOString(), changefreq: 'daily',   priority: '1.0' },
    { url: `${baseUrl}/blog`,            lastmod: new Date().toISOString(), changefreq: 'weekly',  priority: '0.7' },
    { url: `${baseUrl}/privacidade`,     lastmod: new Date().toISOString(), changefreq: 'yearly',  priority: '0.2' },
    { url: `${baseUrl}/termos`,          lastmod: new Date().toISOString(), changefreq: 'yearly',  priority: '0.2' },
  ];

  let productXml = '';
  try {
    const productsSnap = await adminDb.collection('products').get();

    for (const doc of productsSnap.docs) {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const name = data.name || 'Vetor';
      const lastmod = safeIsoDate(data.updatedAt || data.createdAt);

      const productImages: { url: string; title: string }[] = [];

      if (data.urls?.destaque) {
        productImages.push({
          url: buildCleanImageUrl(data.urls.destaque, slug, 'destaque'),
          title: name,
        });
      }
      if (data.urls?.capa && data.urls.capa !== data.urls?.destaque) {
        productImages.push({
          url: buildCleanImageUrl(data.urls.capa, slug, 'capa'),
          title: `${name} — Capa`,
        });
      }
      if (Array.isArray(data.urls?.galeria)) {
        data.urls.galeria.forEach((imgUrl: string, i: number) => {
          if (imgUrl) {
            productImages.push({
              url: buildCleanImageUrl(imgUrl, slug, `galeria-${i + 1}`),
              title: `${name} — Foto ${i + 1}`,
            });
          }
        });
      }

      let imageTagsXml = '';
      for (const img of productImages) {
        if (img.url) {
          imageTagsXml += `
    <image:image>
      <image:loc>${escapeXml(img.url)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>`;
        }
      }

      productXml += `
  <url>
    <loc>${escapeXml(`${baseUrl}/product/${slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>${imageTagsXml}
  </url>`;
    }
  } catch (error) {
    console.error('Sitemap XML: erro ao buscar produtos', error);
  }

  let blogXml = '';
  try {
    const blogSnap = await adminDb
      .collection('blog_posts')
      .where('published', '==', true)
      .get();

    for (const doc of blogSnap.docs) {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const lastmod = safeIsoDate(data.updatedAt || data.createdAt);
      blogXml += `
  <url>
    <loc>${escapeXml(`${baseUrl}/blog/${slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }
  } catch (error) {
    console.error('Sitemap XML: erro ao buscar posts do blog', error);
  }

  const staticXml = staticPages
    .map(
      p => `
  <url>
    <loc>${escapeXml(p.url)}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    )
    .join('');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticXml}${productXml}${blogXml}
</urlset>`;

  return new NextResponse(xmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=14400, stale-while-revalidate=86400',
    },
  });
}
