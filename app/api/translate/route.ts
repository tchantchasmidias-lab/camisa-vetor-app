import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

// Gera uma chave de cache determinística para o par (text, lang)
function makeCacheKey(text: string, target: string): string {
  return crypto.createHash('sha256').update(`${target}:${text}`).digest('hex');
}

export async function POST(request: Request) {
  try {
    // ── Proteção 1: Verificação de Referer (bloqueia chamadas externas diretas) ──
    const referer = request.headers.get('referer') ?? '';
    const origin  = request.headers.get('origin')  ?? '';
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? '';

    const isAllowedOrigin =
      appUrl === '' || // em dev local sem a variável, deixa passar
      referer.startsWith(appUrl) ||
      origin.startsWith(appUrl);

    if (!isAllowedOrigin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Parse do body ──
    const { text, target } = await request.json();

    if (!text || !target) {
      return NextResponse.json({ error: 'Missing text or target language' }, { status: 400 });
    }

    // Não traduz textos muito curtos ou apenas números/símbolos
    if (text.trim().length < 3) {
      return NextResponse.json({ translatedText: text });
    }

    // ── Proteção 2: Cache no Firestore (server-side, compartilhado entre todos os usuários/bots) ──
    const cacheKey = makeCacheKey(text, target);
    const cacheRef = adminDb.collection('translation_cache').doc(cacheKey);

    const cachedDoc = await cacheRef.get();
    if (cachedDoc.exists) {
      // Serve do cache sem chamar a API do Google
      return NextResponse.json({ translatedText: cachedDoc.data()!.translatedText });
    }

    // ── Chamada à API do Google Translate V2 (somente em cache miss) ──
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Translation service not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target, format: 'text' }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Google Translate Error:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const translatedText = data.data.translations[0].translatedText;

    // ── Salva no cache do Firestore para futuras requisições ──
    await cacheRef.set({
      translatedText,
      target,
      // Armazena o texto original sem dados sensíveis; apenas para auditoria
      sourcePreview: text.substring(0, 80),
      createdAt: Date.now(),
    });

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Translation Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
