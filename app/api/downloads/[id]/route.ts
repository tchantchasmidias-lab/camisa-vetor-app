import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    if (!productId) {
      return NextResponse.json({ error: 'ID do produto não fornecido' }, { status: 400 });
    }

    // 1. Extrair token de autorização dos headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let uid: string;

    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      uid = decodedToken.uid;
    } catch (authError) {
      console.error('Erro na verificação do token Firebase:', authError);
      return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
    }

    // 2. Verificar se o usuário possui um pedido PAGO contendo o produto
    const pedidosRef = adminDb.collection('pedidos');
    const q = await pedidosRef
      .where('userId', '==', uid)
      .where('status', '==', 'pago')
      .get();

    let hasPurchased = false;

    for (const docSnap of q.docs) {
      const orderData = docSnap.data();
      if (Array.isArray(orderData.items)) {
        const found = orderData.items.some((item: any) => item.id === productId);
        if (found) {
          hasPurchased = true;
          break;
        }
      }
    }

    if (!hasPurchased) {
      return NextResponse.json(
        { error: 'Você não possui permissão para baixar este vetor. Adquira o produto para liberar o acesso.' },
        { status: 403 }
      );
    }

    // 3. Buscar o link oficial no produto via Admin SDK
    const productSnap = await adminDb.collection('products').doc(productId).get();
    if (!productSnap.exists) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    const productData = productSnap.data();
    const downloadUrl = productData?.urls?.download || productData?.downloadUrl || productData?.fileUrl;

    if (!downloadUrl || downloadUrl === '#') {
      return NextResponse.json({ error: 'Arquivo indisponível no momento. Contate o suporte.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, downloadUrl });
  } catch (error: any) {
    console.error('Erro no endpoint de download seguro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
