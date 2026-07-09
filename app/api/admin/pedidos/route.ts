import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

const ADMIN_EMAIL = 'camisavetor@gmail.com';

async function verificarAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  const decoded = await adminAuth.verifyIdToken(token);
  if (decoded.email !== ADMIN_EMAIL) return null;
  return decoded;
}

export async function GET(req: Request) {
  try {
    const decoded = await verificarAdmin(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const pedSnap = await adminDb.collection('pedidos').orderBy('createdAt', 'desc').get();

    const pedidos = pedSnap.docs.map(doc => {
      const data = doc.data();
      
      let createdAt = data.createdAt;
      if (createdAt && typeof createdAt.toDate === 'function') {
        createdAt = createdAt.toDate().toISOString();
      }

      return {
        id: doc.id,
        ...data,
        createdAt
      };
    });

    return NextResponse.json({ pedidos });
  } catch (error: any) {
    console.error('Erro ao listar pedidos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
