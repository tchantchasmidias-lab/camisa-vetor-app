import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { formatTitleCase } from '@/lib/stringUtils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 🛡️ Autenticação Admin
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (token) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        if (decodedToken.email !== 'camisavetor@gmail.com') {
          return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }
      } catch (authError) {
        return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
      }
    }

    const productsSnap = await adminDb.collection('products').get();
    let updatedCount = 0;
    const changes: { id: string; oldName: string; newName: string }[] = [];

    const batch = adminDb.batch();
    let batchCount = 0;

    for (const doc of productsSnap.docs) {
      const data = doc.data();
      const currentName = data.name || data.title || '';
      const formatted = formatTitleCase(currentName);

      if (formatted && formatted !== currentName) {
        const updateData: Record<string, any> = {
          name: formatted,
          updatedAt: new Date().toISOString(),
        };

        if (data.title !== undefined) {
          updateData.title = formatted;
        }

        batch.update(doc.ref, updateData);
        batchCount++;
        updatedCount++;
        changes.push({
          id: doc.id,
          oldName: currentName,
          newName: formatted,
        });

        // O Firestore limita batches a 500 operações
        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      totalProducts: productsSnap.size,
      updatedCount,
      changes,
    });
  } catch (error: any) {
    console.error('Erro na migração de títulos em lote:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
