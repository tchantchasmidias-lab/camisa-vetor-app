import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Node.js runtime para suporte completo a streaming e fetch de mídia

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new NextResponse('Missing image URL parameter', { status: 400 });
    }

    // 🛡️ Validação de segurança: apenas aceita origens de mídia confiáveis (Firebase / Google Cloud Storage)
    const isAllowedDomain =
      targetUrl.includes('firebasestorage.googleapis.com') ||
      targetUrl.includes('firebasestorage.app') ||
      targetUrl.includes('storage.googleapis.com');

    if (!isAllowedDomain) {
      return new NextResponse('Forbidden host', { status: 403 });
    }

    // Busca a imagem original no Firebase Storage
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CamisaVetorMediaProxy/1.0)',
      },
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch media from upstream storage', { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/webp';
    const imageBuffer = await response.arrayBuffer();

    // Retorna a imagem com URLs amigáveis, cache agressivo de CDN e cabeçalhos liberados para o Googlebot-Image
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        // 🚀 TAREFA 3: Garante que NUNCA envie noindex e autorize explicitamente o Googlebot-Image
        'X-Robots-Tag': 'index, follow, max-image-preview:large',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Media Proxy Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
