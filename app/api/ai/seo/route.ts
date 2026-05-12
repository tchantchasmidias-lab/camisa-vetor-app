import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { title, category } = await req.json();

    if (!title || !category) {
      return NextResponse.json({ error: 'Título e categoria são obrigatórios' }, { status: 400 });
    }

    // Inicializa a API do Google
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');
    
    // Testando com o Gemini Pro (mais compatível com contas em trial)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
    });

    const prompt = `Você é um especialista em SEO para e-commerce de produtos digitais (vetores para estamparia).
      O usuário forneceu um título básico: "${title}" na categoria: "${category}".
      
      Sua tarefa é:
      1. Melhorar o Título para torná-lo atraente para buscas no Google (ex: adicionar palavras como "Vetor", "Premium", "Editável").
      2. Criar uma Descrição curta e objetiva (máximo 3 frases) focada em benefícios (alta qualidade, download imediato, formatos profissionais).
      3. Criar uma Meta Descrição curta para SEO.
      4. Gerar uma lista de 5 a 10 Palavras-Chave separadas por vírgula.

      Responda estritamente em formato JSON válido com as chaves: improvedTitle, description, seoDescription, keywords.
      Não inclua blocos de código markdown (\`\`\`json) ou explicações extras.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json|```/g, '').trim();
    const seoData = JSON.parse(cleanedText);

    return NextResponse.json(seoData);
  } catch (error: any) {
    console.error('Erro detalhado da IA:', error);
    return NextResponse.json({ 
      error: 'Falha na conexão com a IA: ' + error.message,
      details: 'Isso pode ser resolvido clicando no botão "ATIVAR" na barra azul do seu Console Google Cloud.'
    }, { status: 500 });
  }
}
