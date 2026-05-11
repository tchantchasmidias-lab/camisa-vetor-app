import { NextResponse } from 'next/server';
import { ai } from '@/lib/ai/genkit';
import { z } from 'genkit';

export async function POST(req: Request) {
  try {
    const { title, category } = await req.json();

    if (!title || !category) {
      return NextResponse.json({ error: 'Título e categoria são obrigatórios' }, { status: 400 });
    }

    const seoFlow = ai.defineFlow(
      {
        name: 'generateSEO',
        inputSchema: z.object({ title: z.string(), category: z.string() }),
        outputSchema: z.object({
          improvedTitle: z.string(),
          description: z.string(),
          seoDescription: z.string(),
          keywords: z.string(),
        }),
      },
      async (input) => {
        const { text } = await ai.generate({
          model: 'googleai/gemini-1.5-flash',
          prompt: `Você é um especialista em SEO para e-commerce de produtos digitais (vetores para estamparia).
          O usuário forneceu um título básico: "${input.title}" na categoria: "${input.category}".
          
          Sua tarefa é:
          1. Melhorar o Título para torná-lo atraente para buscas no Google (ex: adicionar palavras como "Vetor", "Premium", "Editável").
          2. Criar uma Descrição curta e objetiva (máximo 3 frases) focada em benefícios (alta qualidade, download imediato, formatos profissionais).
          3. Criar uma Meta Descrição curta para SEO.
          4. Gerar uma lista de 5 a 10 Palavras-Chave separadas por vírgula.

          Responda estritamente em formato JSON válido com as chaves: improvedTitle, description, seoDescription, keywords.
          Não inclua blocos de código ou explicações extras.`,
          config: {
            temperature: 0.7,
          }
        });

        // Limpa possíveis blocos de código markdown se a IA retornar
        const cleanedText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedText);
      }
    );

    const result = await ai.runFlow(seoFlow, { title, category });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro na geração de IA:', error);
    return NextResponse.json({ error: 'Falha ao gerar SEO inteligente: ' + error.message }, { status: 500 });
  }
}
