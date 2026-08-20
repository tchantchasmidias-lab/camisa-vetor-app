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

        const prompt = `Você é um especialista em Copywriting e SEO para e-commerce de produtos digitais (vetores e matrizes para estamparia, sublimação e silk-screen).

Tema/Entrada: "${title}"
Categoria: "${category}"

Ao analisar o tema ou arte do produto, retorne estritamente um JSON com a seguinte estrutura:

{
  "title": "Título em Title Case com 50 a 65 caracteres. Exemplo: Vetor Camisa Nossa Senhora das Dores | Arte Editável CorelDRAW",
  "description_body": "Texto persuasivo e comercial para a página de produto (entre 250 e 400 caracteres). Destaque a beleza da arte, riqueza de detalhes, separação em camadas para personalização total (cores e elementos), versatilidade para estamparia/sublimação e valor agregado para os clientes da gráfica/confecção.",
  "meta_description": "Resumo direto para a busca orgânica do Google (entre 140 e 160 caracteres). Focado em CTR, mencionando compatibilidade (.CDR, .PDF, .PNG), edição e download imediato.",
  "keywords": "Lista com 6 a 10 termos e palavras-chave de busca transacional separados por vírgula."
}

DIRETRIZES OBRIGATÓRIAS:
1. "title": Entre 50 e 65 caracteres. Em Title Case (sem caixa alta completa). Coloque o termo e tema principal no início.
   Fórmulas permitidas:
   - Vetor Camisa [Tema do Produto] | Arte Editável CorelDRAW
   - Vetor Premium [Tema do Produto] para Camisa - Arte Editável
   - Estampa [Tema do Produto] | Vetor Editável para Camisa
2. "description_body": Entre 250 e 400 caracteres. Focado em conversão e valor para profissionais de estamparia/gráfica.
3. "meta_description": Entre 140 e 160 caracteres. Focado em SEO e CTR no Google.
4. "keywords": 6 a 10 tags transacionais separadas por vírgula.

Não inclua blocos de código markdown (\`\`\`json) ou explicações extras. Responda apenas o JSON puro.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanedText = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        
        // Garante compatibilidade total de chaves
        const finalTitle = parsed.title || parsed.improvedTitle || '';
        const descriptionBody = parsed.description_body || parsed.description || '';
        const metaDescription = parsed.meta_description || parsed.seoDescription || '';
        const keywords = typeof parsed.keywords === 'string' 
          ? parsed.keywords 
          : Array.isArray(parsed.keywords) 
            ? parsed.keywords.join(', ') 
            : '';

        seoData = {
          title: finalTitle,
          improvedTitle: finalTitle,
          description_body: descriptionBody,
          description: descriptionBody,
          meta_description: metaDescription,
          seoDescription: metaDescription,
          keywords: keywords
        };
        
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
