import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, target } = await request.json();
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Google Translate API Key not configured' }, { status: 500 });
    }

    if (!text || !target) {
      return NextResponse.json({ error: 'Missing text or target language' }, { status: 400 });
    }

    // Chamada para a API do Google Translate V2
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: target,
          format: 'text',
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Google Translate Error:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const translatedText = data.data.translations[0].translatedText;

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Translation Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
