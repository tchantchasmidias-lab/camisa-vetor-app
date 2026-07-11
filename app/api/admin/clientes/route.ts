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

// GET — Lista todos os clientes
export async function GET(req: Request) {
  try {
    const decoded = await verificarAdmin(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const usersSnap = await adminDb.collection('users').orderBy('createdAt', 'desc').get();

    // Busca os usuários no Firebase Auth para saber o método de login (Google vs Email)
    const listUsersResult = await adminAuth.listUsers(1000);
    const authProviders = new Map<string, string>();
    listUsersResult.users.forEach(userRecord => {
      // Se não tiver providerData, assumimos que é password. Se tiver, pegamos o primeiro (ex: google.com)
      const provider = userRecord.providerData.length > 0 ? userRecord.providerData[0].providerId : 'password';
      authProviders.set(userRecord.uid, provider);
    });

    const clientes = usersSnap.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.nome || data.name || data.displayName || 'Sem nome',
        email: data.email || '',
        photoURL: data.photoURL || '',
        createdAt: data.createdAt || null,
        provider: authProviders.get(doc.id) || 'desconhecido',
      };
    });

    return NextResponse.json({ clientes });
  } catch (error: any) {
    console.error('Erro ao listar clientes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — Deleta um cliente pelo uid
export async function DELETE(req: Request) {
  try {
    const decoded = await verificarAdmin(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID não informado' }, { status: 400 });
    }

    // Segurança: não pode deletar o próprio admin
    const userToDelete = await adminDb.collection('users').doc(uid).get();
    if (userToDelete.data()?.email === ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Não é possível deletar o admin' }, { status: 403 });
    }

    // Deleta o documento do usuário no Firestore
    await adminDb.collection('users').doc(uid).delete();

    // Deleta o usuário no Firebase Auth
    try {
      await adminAuth.deleteUser(uid);
    } catch (authErr) {
      // Se falhar no Auth (ex: usuário não existe lá), apenas loga
      console.warn('Aviso: não foi possível deletar do Firebase Auth:', authErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao deletar cliente:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
