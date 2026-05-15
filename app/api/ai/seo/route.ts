import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (decodedToken.email !== 'camisavetor@gmail.com') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

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

        const prompt = `Você é um especialista em SEO para e-commerce de produtos digitais (vetores para estamparia).
          Título: "${title}", Categoria: "${category}".
          
          Sua tarefa é:
          1. Melhorar o Título para torná-lo atraente para buscas no Google (ex: adicionar palavras como "Vetor", "Premium", "Editável").
          2. Criar uma Descrição curta e objetiva (máximo 3 frases) focada em benefícios e design.
          3. Criar uma Meta Descrição curta para SEO.
          4. Gerar uma lista de 5 a 10 Palavras-Chave separadas por vírgula.

          REGRAS IMPORTANTES:
          - NÃO mencione formatos de arquivo (como SVG, AI, EPS, PDF, CDR, etc.) na descrição.
          - NÃO use a palavra "download" ou "arquivo" repetidamente.
          - Foque no estilo da estampa e no público-alvo.

          Responda estritamente em formato JSON válido com as chaves: improvedTitle, description, seoDescription, keywords.
          Não inclua blocos de código markdown (\`\`\`json) ou explicações extras.`;

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
