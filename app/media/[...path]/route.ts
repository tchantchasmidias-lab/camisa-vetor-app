import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs'; // Node.js runtime para suporte completo ao Sharp

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

    const rawArrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(rawArrayBuffer);

    // 🚀 REGRAS DE PROCESSAMENTO DE IMAGEM WEBP (QUALIDADE 90% + LARGURA MÍNIMA 1200PX)
    let processedBuffer: Buffer;
    try {
      const imagePipeline = sharp(inputBuffer);
      const metadata = await imagePipeline.metadata();

      let pipeline = imagePipeline;

      // Garantia de Dimensão: Se a imagem for menor que 1200px de largura, amplia com filtro Lanczos3
      if (metadata.width && metadata.width < 1200) {
        pipeline = pipeline.resize({
          width: 1200,
          fit: 'contain',
          kernel: sharp.kernel.lanczos3,
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        });
      }

      // Qualidade da Conversão WebP: 90% de qualidade sem compressão agressiva e subsampling inteligente
      processedBuffer = await pipeline
        .webp({
          quality: 90,           // Qualidade mínima de 90% (evita artefatos em mockups e vetores)
          smartSubsample: true,  // Preserva detalhes em linhas finas de estampas
          effort: 6,             // Otimização máxima de renderização
        })
        .toBuffer();
    } catch (sharpError) {
      console.warn('Sharp processing failed, serving raw input buffer:', sharpError);
      processedBuffer = inputBuffer;
    }

    // Extrai o slug do produto a partir do nome do arquivo para apontar o canonical HTTP diretamente para a página do produto
    const pathname = request.nextUrl.pathname;
    const fileName = pathname.split('/').pop() || '';
    const cleanSlug = fileName.replace(/-(capa|destaque|galeria-\d+)\.webp$/i, '');

    const responseHeaders: Record<string, string> = {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
      // 🚀 METATAG & CABEÇALHOS: Permite exibição em alta resolução no Google Imagens (max-image-preview:large)
      'X-Robots-Tag': 'index, follow, max-image-preview:large',
      'Access-Control-Allow-Origin': '*',
    };

    // Aponta formalmente ao Googlebot-Image que a página de origem canônica desta imagem é a página de produto
    if (cleanSlug && cleanSlug !== fileName) {
      responseHeaders['Link'] = `<https://camisavetor.com.br/product/${cleanSlug}>; rel="canonical"`;
    }

    // Retorna a imagem WebP otimizada em alta definição com cabeçalhos autorizados para o Googlebot-Image
    return new NextResponse(new Uint8Array(processedBuffer), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Media Proxy Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
