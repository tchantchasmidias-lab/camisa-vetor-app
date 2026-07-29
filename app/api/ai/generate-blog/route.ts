import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const systemPrompt = `Você é um especialista em SEO e redator de conteúdo para o site Camisa Vetor (venda de artes e vetores para sublimação e estamparia).
O usuário pedirá para você criar um post para o blog baseado em um tema.
Você DEVE retornar APENAS um JSON válido e estrito com a seguinte estrutura:
{
  "title": "Título atrativo do post",
  "content": "Conteúdo completo e extenso do post em formato HTML. Use <h2>, <h3>, <p>, <ul>, <strong>, etc. para estruturar bem o texto e torná-lo visualmente agradável.",
  "seoMetadata": {
    "title": "Título SEO (max 60 caracteres)",
    "description": "Meta descrição atrativa (max 160 caracteres)",
    "keywords": ["palavra-chave 1", "palavra-chave 2"]
  }
}
Importante: Retorne EXATAMENTE e APENAS o JSON. Não adicione crases de bloco de código (\`\`\`json) ou qualquer outro texto antes ou depois.
O conteúdo gerado deve ser rico, engajador, com linguagem persuasiva e otimizado para os motores de busca, visando atrair clientes interessados em estampas, design e vetores.
`;

    const result = await model.generateContent(systemPrompt + "\n\nComando do usuário: " + prompt);
    const text = result.response.text();
    
    // Clean up potential markdown JSON block wrappers just in case
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let blogData;
    try {
      blogData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON Parse error on AI response:', cleanedText);
      return NextResponse.json({ error: 'AI returned malformed JSON', rawText: cleanedText }, { status: 500 });
    }

    return NextResponse.json(blogData);
  } catch (error: any) {
    console.error('Error generating blog post:', error);
    return NextResponse.json({ error: error.message || 'Error generating content' }, { status: 500 });
  }
}
