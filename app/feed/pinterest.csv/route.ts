import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { buildCleanImageUrl } from '@/lib/mediaUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

function escapeCsvField(field: string): string {
  if (!field) return '""';
  const clean = field.replace(/"/g, '""');
  return `"${clean}"`;
}

export async function GET() {
  const baseUrl = 'https://camisavetor.com.br';

  const rows: string[] = [
    'id,title,description,link,image_link,price,availability,condition,brand',
  ];

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
      const availability = 'in stock';
      const condition = 'new';
      const brand = 'Camisa Vetor';

      const row = [
        escapeCsvField(id),
        escapeCsvField(title),
        escapeCsvField(description),
        escapeCsvField(link),
        escapeCsvField(imageLink),
        escapeCsvField(priceFormatted),
        escapeCsvField(availability),
        escapeCsvField(condition),
        escapeCsvField(brand),
      ].join(',');

      rows.push(row);
    }
  } catch (error) {
    console.error('Erro ao gerar feed Pinterest CSV:', error);
  }

  return new NextResponse(rows.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=14400, stale-while-revalidate=86400',
    },
  });
}
