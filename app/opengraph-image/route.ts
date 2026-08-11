import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return new NextResponse('Image Removed', {
    status: 410, // 410 Gone: avisa expressamente ao Googlebot que a imagem foi removida permanentemente
    headers: {
      'Content-Type': 'text/plain',
      'X-Robots-Tag': 'noindex, nofollow, noimageindex',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
