import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { buildCleanImageUrl } from '@/lib/mediaUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalida o feed a cada 1 hora

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = 'https://camisavetor.com.br';

  let itemsXml = '';
  try {
    const productsSnap = await adminDb.collection('products').get();

    for (const doc of productsSnap.docs) {
      const data = doc.data();
      const id = doc.id;
      const slug = data.slug || id;
      const title = data.name || 'Vetor Editável Profissional';
      const description =
        data.description ||
        `Arte vetorizada editável de ${title} para sublimação e estamparia. Download imediato após confirmação.`;
      const link = `${baseUrl}/product/${slug}`;

      const rawImage =
        data.urls?.destaque ||
        data.urls?.capa ||
        (Array.isArray(data.urls?.galeria) ? data.urls.galeria[0] : '');
      const imageLink = buildCleanImageUrl(rawImage, slug, 'destaque');

      const priceNumber = Number(data.price) || 0;
      const priceFormatted = `${priceNumber.toFixed(2)} BRL`;

      itemsXml += `
    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:price>${escapeXml(priceFormatted)}</g:price>
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Camisa Vetor</g:brand>
      <g:google_product_category>Media &gt; Digital Goods</g:google_product_category>
    </item>`;
    }
  } catch (error) {
    console.error('Erro ao gerar feed Pinterest XML:', error);
  }

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Camisa Vetor — Catálogo de Produtos</title>
    <link>${baseUrl}</link>
    <description>Catálogo de vetores profissionais para estamparia e sublimação</description>${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=14400, stale-while-revalidate=86400',
    },
  });
}
