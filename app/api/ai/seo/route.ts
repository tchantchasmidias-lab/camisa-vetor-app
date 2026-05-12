import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { title, category } = await req.json();

    if (!title || !category) {
      return NextResponse.json({ error: 'Título e categoria são obrigatórios' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');
    
    // Lista de modelos para tentar (do mais novo para o mais estável)
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-2.0-flash'
    ];

    let lastError = null;
    let seoData = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Tentando IA com modelo: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `Você é um especialista em SEO para e-commerce de produtos digitais.
          Título: "${title}", Categoria: "${category}".
          Responda apenas com um JSON válido (sem markdown) contendo: improvedTitle, description, seoDescription, keywords.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanedText = text.replace(/```json|```/g, '').trim();
        seoData = JSON.parse(cleanedText);
        
        console.log(`✅ Sucesso com o modelo: ${modelName}`);
        break; // Sai do loop se conseguir
      } catch (e: any) {
        console.error(`❌ Falha com o modelo ${modelName}:`, e.message);
        lastError = e;
        continue; // Tenta o próximo da lista
      }
    }

    if (!seoData) {
      throw new Error(`Todos os modelos falharam. Último erro: ${lastError?.message}`);
    }

    return NextResponse.json(seoData);
  } catch (error: any) {
    console.error('Erro final na IA:', error);
    return NextResponse.json({ 
      error: 'Erro na IA: ' + error.message 
    }, { status: 500 });
  }
}
