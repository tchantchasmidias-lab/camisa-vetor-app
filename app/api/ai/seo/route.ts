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

        const prompt = `Você é um especialista em SEO para e-commerce de produtos digitais (vetores e matrizes para estamparia e sublimação).
Ao receber o tema ou arte do produto, gere um JSON com a seguinte estrutura:

Tema/Entrada: "${title}"
Categoria: "${category}"

DIRETRIZES OBRIGATÓRIAS:

1. REGRAS ESTRITAS PARA O TÍTULO ("title" / "improvedTitle"):
- Limite de Comprimento: Entre 50 e 65 caracteres (NUNCA ultrapassar 65 caracteres para não cortar no Google).
- Capitalização: Formato Title Case / Capitalized (apenas a primeira letra de palavras importantes em maiúscula). PROIBIDO usar texto inteiro em caixa alta (ALL CAPS).
- Estrutura Obrigatória: Colocar a palavra-chave principal e o tema específico no início do título.
- Evitar Keyword Stuffing: Não repetir sinônimos desnecessários (como "Vetor Arte Estampa Desenho" juntos).
- FÓRMULAS DE TÍTULOS PERMITIDAS (escolha a que melhor se adequar ao limite de caracteres):
  * Fórmula 1: Vetor Camisa [Tema do Produto] | Arte Editável CorelDRAW
  * Fórmula 2: Vetor Premium [Tema do Produto] para Camisa - Arte Editável
  * Fórmula 3: Estampa [Tema do Produto] | Vetor Editável para Camisa
  Exemplo: "Vetor Camisa Nossa Senhora das Dores | Arte Editável CorelDRAW"

2. DESCRIÇÃO ("description" e "seoDescription"):
- Descrição persuasiva e técnica de 140 a 160 caracteres destacando compatibilidade (.CDR, .PDF, .PNG), camadas 100% editáveis e download imediato.

3. PALAVRAS-CHAVE ("keywords"):
- Lista com 6 a 10 tags estratégicas de busca transacional separadas por vírgula.

Responda estritamente em formato JSON válido com as seguintes chaves:
{
  "title": "Título otimizado no formato Title Case com 50-65 caracteres",
  "improvedTitle": "Título otimizado no formato Title Case com 50-65 caracteres",
  "description": "Descrição persuasiva de 140 a 160 caracteres destacando .CDR, .PDF, .PNG e download imediato",
  "seoDescription": "Meta descrição técnica e persuasiva de 140 a 160 caracteres",
  "keywords": "tag 1, tag 2, tag 3, tag 4, tag 5, tag 6, tag 7, tag 8"
}
Não inclua blocos de código markdown (\`\`\`json) ou explicações extras.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanedText = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        
        // Garante compatibilidade de chaves
        const finalTitle = parsed.title || parsed.improvedTitle;
        seoData = {
          title: finalTitle,
          improvedTitle: finalTitle,
          description: parsed.description || '',
          seoDescription: parsed.seoDescription || parsed.description || '',
          keywords: typeof parsed.keywords === 'string' ? parsed.keywords : Array.isArray(parsed.keywords) ? parsed.keywords.join(', ') : ''
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
