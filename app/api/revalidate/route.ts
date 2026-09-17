import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetPath = body.path || '/';

    // Revalida Home, Catálogo e rota adicional se informada
    try {
      revalidatePath('/');
      revalidatePath('/catalog');
      if (targetPath && targetPath !== '/' && targetPath !== '/catalog') {
        revalidatePath(targetPath);
      }
    } catch (revalErr) {
      console.warn('Aviso ao revalidar caminhos:', revalErr);
    }

    return NextResponse.json({
      revalidated: true,
      paths: ['/', '/catalog', targetPath],
      now: Date.now(),
    });
  } catch (error: any) {
    console.error('Erro na API de revalidação:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar revalidação' },
      { status: 500 }
    );
  }
}
